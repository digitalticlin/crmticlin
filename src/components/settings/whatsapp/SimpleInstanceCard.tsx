import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Smartphone,
  Clock,
  CheckCircle,
  AlertTriangle,
  QrCode,
  Loader2,
  Trash2,
  GitBranch
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { WhatsAppWebInstance } from "@/types/whatsapp";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";


interface Funnel {
  id: string;
  name: string;
  color?: string;
}

interface SimpleInstanceCardProps {
  instance: WhatsAppWebInstance;
  onGenerateQR: (instanceId: string, instanceName: string) => void;
  onDelete: (instanceId: string) => void;
}

export const SimpleInstanceCard = ({
  instance,
  onGenerateQR,
  onDelete
}: SimpleInstanceCardProps) => {
  const { user } = useAuth();
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [leadsCount, setLeadsCount] = useState(0);
  const [isLoadingFunnels, setIsLoadingFunnels] = useState(false);
  const [showFunnelDialog, setShowFunnelDialog] = useState(false);
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>("");
  const [isUpdatingFunnel, setIsUpdatingFunnel] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const getStatusInfo = () => {
    const status = instance.connection_status?.toLowerCase() || 'unknown';

    switch (status) {
      case 'ready':
      case 'connected':
        return {
          color: 'bg-green-100/60 text-green-800 backdrop-blur-sm border-green-200/50',
          icon: CheckCircle,
          text: 'Conectado',
          description: 'WhatsApp conectado e funcionando'
        };
      case 'connecting':
      case 'initializing':
        return {
          color: 'bg-yellow-100/60 text-yellow-800 backdrop-blur-sm border-yellow-200/50',
          icon: Clock,
          text: 'Conectando',
          description: 'Estabelecendo conexão...'
        };
      case 'qr_generated':
      case 'waiting_scan':
      case 'qr_ready':
        return {
          color: 'bg-blue-100/60 text-blue-800 backdrop-blur-sm border-blue-200/50',
          icon: AlertTriangle,
          text: 'Aguardando QR',
          description: 'QR Code disponível para escaneamento'
        };
      default:
        return {
          color: 'bg-gray-100/60 text-gray-800 backdrop-blur-sm border-gray-200/50',
          icon: AlertTriangle,
          text: 'Desconectado',
          description: 'Precisa conectar'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const isConnected = ['ready', 'connected'].includes(instance.connection_status?.toLowerCase() || '');

  const needsQrCode = !isConnected ||
    (instance.web_status === 'waiting_qr') ||
    ['waiting_scan', 'qr_ready', 'disconnected'].includes(
      instance.connection_status?.toLowerCase() || 'unknown'
    );

  // Buscar funis do usuário
  useEffect(() => {
    const fetchFunnels = async () => {
      if (!user?.id || !isConnected) return;

      setIsLoadingFunnels(true);
      try {
        const { data, error } = await supabase
          .from('funnels')
          .select('id, name')
          .eq('created_by_user_id', user.id)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setFunnels(data || []);
      } catch (error) {
        console.error('Erro ao buscar funis:', error);
      } finally {
        setIsLoadingFunnels(false);
      }
    };

    fetchFunnels();
  }, [user?.id, isConnected]);

  // Buscar contagem de leads da instância
  useEffect(() => {
    const fetchLeadsCount = async () => {
      if (!instance.id) return;

      try {
        const { data, error } = await supabase
          .from('leads')
          .select('id')
          .eq('whatsapp_number_id', instance.id);

        if (error) throw error;
        setLeadsCount(data?.length || 0);
      } catch (error) {
        console.error('Erro ao buscar contagem de leads:', error);
      }
    };

    fetchLeadsCount();
  }, [instance.id]);

  // Função para atualizar funil da instância
  const handleFunnelChange = async (funnelId: string) => {
    setIsUpdatingFunnel(true);
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({ funnel_id: funnelId })
        .eq('id', instance.id);

      if (error) throw error;

      toast({
        title: "Funil atualizado!",
        description: `Todos os contatos foram movidos para a primeira etapa do novo funil.`,
      });

      // Recarregar página para refletir mudança
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar funil:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar funil",
        description: "Tente novamente em alguns instantes.",
      });
    } finally {
      setIsUpdatingFunnel(false);
      setShowFunnelDialog(false);
      setSelectedFunnelId("");
    }
  };

  // Função para solicitar QR Code diretamente à VPS
  const handleGenerateQRDirect = async () => {
    console.log('[SimpleInstanceCard] 🔄 Solicitando QR Code para instância:', instance.id);
    setIsGeneratingQR(true);

    try {
      console.log('[SimpleInstanceCard] 📡 Invocando edge function whatsapp_qr_manager...');

      const { data, error } = await supabase.functions.invoke('whatsapp_qr_manager', {
        body: { instanceId: instance.id }
      });

      console.log('[SimpleInstanceCard] 📥 Resposta recebida:', { data, error });

      // Parse data se for string
      let parsedData = data;
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
          console.log('[SimpleInstanceCard] 🔄 Data parseada:', parsedData);
        } catch (e) {
          console.error('[SimpleInstanceCard] ❌ Erro ao parsear data:', e);
        }
      }

      if (error) {
        console.error('[SimpleInstanceCard] ❌ Erro na edge function:', error);
        sonnerToast.error(`Erro ao gerar QR Code: ${error.message || 'Desconhecido'}`);
        return;
      }

      if (parsedData?.success) {
        if (parsedData.connected) {
          console.log('[SimpleInstanceCard] 🎉 Instância já conectada!');
          sonnerToast.success('WhatsApp já está conectado!');
          return;
        }

        if (parsedData.qrCode) {
          console.log('[SimpleInstanceCard] ✅ QR Code recebido, abrindo modal');
          sonnerToast.success('QR Code gerado! Abrindo modal...');
          // Abrir modal com QR Code
          onGenerateQR(instance.id, instance.instance_name);
          return;
        }
      }

      if (parsedData?.waiting) {
        console.log('[SimpleInstanceCard] ⏳ QR ainda não disponível, abrindo modal para aguardar');
        sonnerToast.info('QR Code será gerado automaticamente');
        onGenerateQR(instance.id, instance.instance_name);
      } else {
        console.log('[SimpleInstanceCard] ⚠️ Resposta sem sucesso:', parsedData);
        sonnerToast.error(parsedData?.error || parsedData?.message || 'Erro ao gerar QR Code');
      }

    } catch (err: any) {
      console.error('[SimpleInstanceCard] ❌ Erro inesperado:', err);
      console.error('[SimpleInstanceCard] ❌ Stack trace:', err.stack);
      sonnerToast.error(`Erro de conexão: ${err.message || 'Desconhecido'}`);
    } finally {
      console.log('[SimpleInstanceCard] ✅ Finalizando requisição');
      setIsGeneratingQR(false);
    }
  };


  return (
    <Card className="group relative transition-all duration-300 hover:shadow-glass-lg hover:-translate-y-1
      bg-white/20 backdrop-blur-xl border border-white/20 shadow-glass rounded-2xl overflow-hidden
      min-h-[220px] flex flex-col">
      
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* Header: Status badge apenas */}
      <CardHeader className="pb-2 relative z-10 flex-shrink-0">
        <div className="flex justify-center">
          <Badge className={`${statusInfo.color}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.text}
          </Badge>
        </div>
      </CardHeader>

      {/* Corpo Central: Profile info e telefone */}
      <CardContent className="flex-1 flex flex-col justify-center items-center text-center space-y-4 relative z-10 px-6">
        <div className="space-y-3">
          {/* Profile Pic se conectado */}
          {isConnected && instance.profile_pic_url && (
            <div className="flex justify-center">
              <img 
                src={instance.profile_pic_url} 
                alt="Profile"
                className="w-16 h-16 rounded-full border-2 border-white shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Profile Name se conectado */}
          {isConnected && instance.profile_name && (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                {instance.profile_name}
              </h3>
            </div>
          )}
          
          {/* Telefone se disponível */}
          {instance.phone && (
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <span className="text-sm font-medium">📱 {instance.phone}</span>
            </div>
          )}
          
          {/* Descrição do status para não conectados */}
          {!isConnected && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {statusInfo.description}
            </p>
          )}
          
          {/* Data de conexão */}
          {instance.date_connected && isConnected && (
            <p className="text-xs text-gray-500">
              Conectado em {new Date(instance.date_connected).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </CardContent>

      {/* Funil - Apenas para instâncias conectadas */}
      {isConnected && funnels.length > 0 && (
        <div className="px-3 py-1.5 border-t border-white/10 relative z-10">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <GitBranch className="h-3 w-3 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Funil Vinculado</span>
          </div>

          <div className="flex justify-center">
            <Select
              value={instance.funnel_id || ""}
              onValueChange={(funnelId) => {
                if (funnelId !== instance.funnel_id) {
                  setSelectedFunnelId(funnelId);
                  setShowFunnelDialog(true);
                }
              }}
              disabled={isUpdatingFunnel || isLoadingFunnels}
            >
              <SelectTrigger className="h-6 text-xs border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors w-[50%]">
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent className="min-w-[180px]">
                {funnels.map(funnel => (
                  <SelectItem key={funnel.id} value={funnel.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
                      {funnel.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isUpdatingFunnel && (
            <div className="text-xs text-blue-600 flex items-center justify-center gap-1 mt-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Atualizando...</span>
            </div>
          )}
        </div>
      )}

      {/* Footer: Botões de ação - padding e gap reduzidos */}
      <div className="p-3 border-t border-white/10 relative z-10 flex-shrink-0">
        <div className="flex gap-1.5 justify-center">
          {needsQrCode && (
            <Button
              variant="default"
              size="sm"
              onClick={handleGenerateQRDirect}
              disabled={isGeneratingQR}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              {isGeneratingQR ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-1" />
                  Gerar QR
                </>
              )}
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50/60 backdrop-blur-sm border-white/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja deletar esta instância WhatsApp{instance.phone ? ` (${instance.phone})` : ''}? 
                  Esta ação não pode ser desfeita e removerá permanentemente:
                  <br />
                  • Conexão WhatsApp
                  • Histórico de conversas
                  • Configurações da instância
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(instance.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Sim, deletar instância
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Dialog de Confirmação para Mudança de Funil */}
      <AlertDialog open={showFunnelDialog} onOpenChange={setShowFunnelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar Funil de Vendas</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os contatos deste WhatsApp ({leadsCount} contatos) serão movidos para a primeira etapa do novo funil. Esta ação não pode ser desfeita.
              <br /><br />
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowFunnelDialog(false);
              setSelectedFunnelId("");
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleFunnelChange(selectedFunnelId)}>
              Sim, mover contatos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
