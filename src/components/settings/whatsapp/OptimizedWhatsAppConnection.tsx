
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MessageSquare, Plus } from "lucide-react";
import { useWhatsAppDatabase } from "@/hooks/whatsapp/useWhatsAppDatabase";
import { useOptimizedInstanceCreation } from "@/hooks/whatsapp/useOptimizedInstanceCreation";
import { OptimizedQRModal } from "./OptimizedQRModal";
import { SimpleInstanceCard } from "./SimpleInstanceCard";
import { ConnectWhatsAppButton } from "./ConnectWhatsAppButton";
import { toast } from "sonner";

export const OptimizedWhatsAppConnection = () => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');
  const [autoStartPolling, setAutoStartPolling] = useState(false);

  const { instances, isLoading, refetch } = useWhatsAppDatabase();
  const { 
    isCreating, 
    creationStage, 
    createdInstance, 
    createInstanceWithConfirmation, 
    reset: resetCreation 
  } = useOptimizedInstanceCreation();

  const handleOptimizedConnect = async () => {
    console.log('[Optimized Connection] 🚀 Iniciando fluxo híbrido otimizado');
    
    try {
      // ETAPA 1: Criar instância e aguardar confirmação da VPS
      const result = await createInstanceWithConfirmation();
      
      if (result.success && result.instance) {
        console.log('[Optimized Connection] ✅ Instância criada - abrindo modal com auto-polling');
        
        // ETAPA 2: Abrir modal IMEDIATAMENTE após confirmação
        setSelectedInstanceId(result.instance.id);
        setSelectedInstanceName(result.instance.instance_name);
        setAutoStartPolling(true); // Iniciar polling automaticamente
        setShowQRModal(true);
        
        // ETAPA 3: Atualizar lista de instâncias
        await refetch();
        
        console.log('[Optimized Connection] 🎯 Fluxo completo: CREATE → CONFIRMAÇÃO → MODAL → AUTO-POLLING');
        
      } else {
        throw new Error(result.error || 'Falha na criação da instância');
      }
      
    } catch (error: any) {
      console.error('[Optimized Connection] ❌ Erro no fluxo:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      resetCreation();
    }
  };

  const handleManualQRGeneration = (instanceId: string, instanceName: string) => {
    console.log('[Optimized Connection] 🔄 Geração manual de QR Code:', { instanceId, instanceName });
    
    setSelectedInstanceId(instanceId);
    setSelectedInstanceName(instanceName);
    setAutoStartPolling(false); // Modo manual - usuário deve clicar
    setShowQRModal(true);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'delete_instance',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast.success('Instância deletada com sucesso!');
        await refetch();
      } else {
        throw new Error(data.error || 'Falha ao deletar instância');
      }
    } catch (error: any) {
      console.error('[Optimized Connection] ❌ Erro ao deletar:', error);
      toast.error(`Erro ao deletar: ${error.message}`);
    }
  };

  const closeQRModal = () => {
    console.log('[Optimized Connection] 🧹 Fechando modal otimizado');
    setShowQRModal(false);
    setSelectedInstanceId('');
    setSelectedInstanceName('');
    setAutoStartPolling(false);
  };

  if (isLoading) {
    return (
      <Card className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-700 font-medium">Carregando suas conexões WhatsApp...</p>
        </CardContent>
      </Card>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="space-y-6">
        <ConnectWhatsAppButton 
          onConnect={handleOptimizedConnect} 
          isConnecting={isCreating}
        />
        
        {isCreating && (
          <Card className="bg-blue-50/80 backdrop-blur-xl border border-blue-200/50 rounded-2xl">
            <CardContent className="p-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">{creationStage}</p>
              <p className="text-xs text-blue-700 mt-1">
                Fluxo híbrido: Criação → Confirmação → QR Code
              </p>
            </CardContent>
          </Card>
        )}

        <OptimizedQRModal
          isOpen={showQRModal}
          onClose={closeQRModal}
          instanceId={selectedInstanceId}
          instanceName={selectedInstanceName}
          autoStartPolling={autoStartPolling}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {instances.map((instance) => (
          <SimpleInstanceCard
            key={instance.id}
            instance={instance}
            onGenerateQR={handleManualQRGeneration}
            onDelete={handleDeleteInstance}
            onRefreshQRCode={() => Promise.resolve({ success: true })}
          />
        ))}
        
        {/* Card para adicionar nova conexão */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-dashed border-green-300 hover:border-green-400 transition-all duration-200 cursor-pointer">
          <CardContent className="p-6 text-center" onClick={handleOptimizedConnect}>
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-green-100">
                <Plus className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Nova Conexão</h3>
                <p className="text-sm text-green-600 mt-1">
                  Adicionar outra instância WhatsApp
                </p>
              </div>
              {isCreating ? (
                <div className="flex items-center gap-2 text-green-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{creationStage}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">Clique para conectar</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <OptimizedQRModal
        isOpen={showQRModal}
        onClose={closeQRModal}
        instanceId={selectedInstanceId}
        instanceName={selectedInstanceName}
        autoStartPolling={autoStartPolling}
      />
    </div>
  );
};
