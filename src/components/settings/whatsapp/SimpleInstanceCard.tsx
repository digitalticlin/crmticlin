
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Trash2, Phone, CheckCircle, Clock, AlertCircle, Loader2, Wifi, WifiOff } from "lucide-react";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { toast } from "sonner";

interface SimpleInstanceCardProps {
  instance: WhatsAppWebInstance;
  onGenerateQR: (instanceId: string, instanceName: string) => Promise<void>;
  onDelete: (instanceId: string) => Promise<void>;
  onRefreshQRCode: (instanceId: string) => Promise<{ qrCode?: string } | null>;
}

export const SimpleInstanceCard = ({
  instance,
  onGenerateQR,
  onDelete,
  onRefreshQRCode
}: SimpleInstanceCardProps) => {
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusInfo = () => {
    if (instance.connection_status === 'connected' || instance.connection_status === 'open') {
      return {
        label: 'Conectado',
        description: 'WhatsApp ativo e funcionando',
        icon: Wifi,
        color: 'bg-emerald-500/20 text-emerald-700 border-emerald-300/50',
        bgGradient: 'from-emerald-50/80 to-green-100/60',
        canRetry: false
      };
    }
    
    if (instance.web_status === 'waiting_scan' && instance.qr_code) {
      return {
        label: 'Aguardando QR Code',
        description: 'Escaneie o código QR para conectar',
        icon: QrCode,
        color: 'bg-blue-500/20 text-blue-700 border-blue-300/50',
        bgGradient: 'from-blue-50/80 to-sky-100/60',
        canRetry: false
      };
    }
    
    if (instance.web_status === 'connecting' || instance.connection_status === 'connecting') {
      return {
        label: 'Conectando',
        description: 'Estabelecendo conexão...',
        icon: Clock,
        color: 'bg-amber-500/20 text-amber-700 border-amber-300/50',
        bgGradient: 'from-amber-50/80 to-orange-100/60',
        canRetry: false
      };
    }

    if (instance.web_status === 'error' || instance.connection_status === 'error') {
      return {
        label: 'Erro de Conexão',
        description: 'Problema na conexão. Tente novamente.',
        icon: WifiOff,
        color: 'bg-red-500/20 text-red-700 border-red-300/50',
        bgGradient: 'from-red-50/80 to-pink-100/60',
        canRetry: true
      };
    }
    
    return {
      label: 'Pronto para Conectar',
      description: 'Gere o QR Code para começar',
      icon: AlertCircle,
      color: 'bg-gray-500/20 text-gray-700 border-gray-300/50',
      bgGradient: 'from-gray-50/80 to-slate-100/60',
      canRetry: true
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const handleGenerateQR = async () => {
    setIsGeneratingQR(true);
    try {
      await onGenerateQR(instance.id, instance.instance_name);
    } catch (error: any) {
      toast.error(`Erro ao gerar QR Code: ${error.message}`);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja deletar "${instance.instance_name}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(instance.id);
        toast.success('Instância deletada com sucesso');
      } catch (error: any) {
        toast.error(`Erro ao deletar: ${error.message}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 
      bg-gradient-to-br ${statusInfo.bgGradient} backdrop-blur-xl 
      border border-white/40 rounded-3xl min-h-[320px]
      before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:pointer-events-none`}>
      
      <CardContent className="relative z-10 p-8 h-full flex flex-col">
        {/* Header com Nome e Status */}
        <div className="flex-1 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl 
              bg-white/30 backdrop-blur-sm border border-white/40 shadow-lg mb-2">
              <StatusIcon className="h-8 w-8 text-gray-700" />
            </div>
            
            <h3 className="font-bold text-xl text-gray-800 mb-2">{instance.instance_name}</h3>
            
            <Badge className={`${statusInfo.color} border backdrop-blur-sm px-4 py-2 text-sm font-medium`}>
              {statusInfo.label}
            </Badge>
            
            <p className="text-sm text-gray-600 leading-relaxed">
              {statusInfo.description}
            </p>
          </div>

          {/* Informações do Telefone */}
          {instance.phone && (
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl 
              bg-white/20 backdrop-blur-sm border border-white/30">
              <Phone className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700 font-medium">{instance.phone}</span>
            </div>
          )}

          {/* Informação da VPS */}
          {instance.vps_instance_id && (
            <div className="text-center">
              <p className="text-xs text-gray-500">
                VPS: {instance.vps_instance_id.substring(0, 8)}...
              </p>
            </div>
          )}

          {/* Dica para usuário */}
          {statusInfo.canRetry && (
            <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl 
              border border-blue-200/50 backdrop-blur-sm">
              <p className="text-sm text-blue-700 text-center leading-relaxed">
                💡 <strong>Dica:</strong> Clique em "Gerar QR Code" para conectar seu WhatsApp
              </p>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 pt-6">
          {(instance.connection_status !== 'connected' && instance.connection_status !== 'open') && (
            <Button
              onClick={handleGenerateQR}
              disabled={isGeneratingQR}
              size="lg"
              className={`flex-1 h-12 text-white font-semibold rounded-xl shadow-lg 
                transition-all duration-200 hover:shadow-xl
                ${statusInfo.canRetry 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                }`}
            >
              {isGeneratingQR ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <QrCode className="h-5 w-5 mr-2" />
                  Gerar QR Code
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="outline"
            size="lg"
            className="h-12 px-4 bg-white/20 backdrop-blur-sm border border-red-200/50 
              text-red-600 hover:bg-red-50/80 hover:border-red-300 rounded-xl
              transition-all duration-200"
          >
            {isDeleting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Trash2 className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
