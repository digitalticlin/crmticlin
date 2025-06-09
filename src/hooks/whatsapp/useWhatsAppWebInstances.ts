
import { useState, useEffect, useCallback } from "react";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { ImprovedQRService } from "@/services/whatsapp/improvedQRService";
import { useIntelligentQRPolling } from "./useIntelligentQRPolling";
import { toast } from "sonner";

export const useWhatsAppWebInstances = () => {
  const [instances, setInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // HÍBRIDO: Estados do modal e polling
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');
  const [currentInstanceId, setCurrentInstanceId] = useState<string | null>(null);

  // HÍBRIDO: Hook de polling inteligente
  const {
    isPolling,
    currentAttempt,
    qrCode: pollingQRCode,
    error: pollingError,
    timedOut,
    isWaiting,
    startPolling,
    stopPolling,
    reset: resetPolling
  } = useIntelligentQRPolling();

  // HÍBRIDO: Sincronizar QR Code do polling com o modal
  useEffect(() => {
    if (pollingQRCode && showQRModal) {
      console.log(`[Instances Hook] ✅ HÍBRIDO: QR Code obtido via polling!`);
      setSelectedQRCode(pollingQRCode);
      toast.success('QR Code gerado com sucesso!');
    }
  }, [pollingQRCode, showQRModal]);

  // HÍBRIDO: Tratar erros do polling
  useEffect(() => {
    if (pollingError && showQRModal) {
      console.log(`[Instances Hook] ❌ HÍBRIDO: Erro no polling:`, pollingError);
      toast.error(`Erro ao gerar QR Code: ${pollingError}`);
    }
  }, [pollingError, showQRModal]);

  // HÍBRIDO: Tratar timeout do polling
  useEffect(() => {
    if (timedOut && showQRModal) {
      console.log(`[Instances Hook] ⏰ HÍBRIDO: Timeout no polling`);
      toast.error('Timeout ao gerar QR Code. Tente novamente.');
    }
  }, [timedOut, showQRModal]);

  const fetchInstances = useCallback(async () => {
    try {
      setError(null);
      const data = await WhatsAppWebService.getInstances();
      setInstances(data);
    } catch (err: any) {
      console.error('[Instances Hook] ❌ Erro ao buscar instâncias:', err);
      setError(err.message || 'Erro ao buscar instâncias');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const createInstance = useCallback(async (instanceName: string) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      console.log(`[Instances Hook] 🚀 HÍBRIDO: Criando instância: ${instanceName}`);
      
      const result = await WhatsAppWebService.createInstance(instanceName);
      
      console.log(`[Instances Hook] 📥 HÍBRIDO: Resultado:`, {
        success: result.success,
        hasInstance: !!(result.instance),
        shouldShowModal: result.shouldShowModal,
        error: result.error
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar instância');
      }

      if (result.success && result.instance && result.shouldShowModal) {
        console.log(`[Instances Hook] 🎯 HÍBRIDO: Abrindo modal e iniciando polling para: ${result.instance.id}`);
        
        // HÍBRIDO: Configurar modal
        setCurrentInstanceId(result.instance.id);
        setSelectedInstanceName(result.instance.instance_name);
        setSelectedQRCode(null);
        setShowQRModal(true);
        
        // HÍBRIDO: Iniciar polling automaticamente
        await startPolling(result.instance.id, {
          maxAttempts: 8,
          timeoutMs: 120000,
          intervalMs: 4000,
          successCallback: (qrCode) => {
            console.log(`[Instances Hook] ✅ HÍBRIDO: QR Code recebido via callback!`);
            setSelectedQRCode(qrCode);
          },
          errorCallback: (error) => {
            console.log(`[Instances Hook] ❌ HÍBRIDO: Erro via callback:`, error);
          },
          timeoutCallback: () => {
            console.log(`[Instances Hook] ⏰ HÍBRIDO: Timeout via callback`);
          }
        });
        
        toast.success('Instância criada! Gerando QR Code...');
      }

      // Atualizar lista de instâncias
      await fetchInstances();

    } catch (error: any) {
      console.error(`[Instances Hook] ❌ HÍBRIDO: Erro na criação:`, error);
      setError(error.message);
      toast.error(`Erro ao criar instância: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  }, [startPolling, fetchInstances]);

  const deleteInstance = useCallback(async (instanceId: string) => {
    try {
      const result = await WhatsAppWebService.deleteInstance(instanceId);
      
      if (result.success) {
        toast.success('Instância deletada com sucesso');
        await fetchInstances();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('[Instances Hook] ❌ Erro ao deletar:', error);
      toast.error(`Erro ao deletar instância: ${error.message}`);
    }
  }, [fetchInstances]);

  const refreshQRCode = useCallback(async (instanceId: string) => {
    try {
      const result = await ImprovedQRService.refreshQRCode(instanceId);
      
      if (result.success && result.qrCode) {
        return { success: true, qrCode: result.qrCode };
      }
      
      throw new Error(result.error || 'Erro ao atualizar QR Code');
    } catch (error: any) {
      console.error('[Instances Hook] ❌ Erro ao atualizar QR:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const closeQRModal = useCallback(() => {
    console.log(`[Instances Hook] 🧹 HÍBRIDO: Fechando modal e parando polling`);
    setShowQRModal(false);
    setSelectedQRCode(null);
    setSelectedInstanceName('');
    setCurrentInstanceId(null);
    stopPolling('modal fechado');
    resetPolling();
  }, [stopPolling, resetPolling]);

  const retryQRCode = useCallback(async () => {
    if (!currentInstanceId) {
      console.error('[Instances Hook] ❌ HÍBRIDO: Nenhuma instância para retry');
      return;
    }

    console.log(`[Instances Hook] 🔄 HÍBRIDO: Retry para instância: ${currentInstanceId}`);
    
    // Reset estado
    setSelectedQRCode(null);
    resetPolling();
    
    // Reiniciar polling
    await startPolling(currentInstanceId, {
      maxAttempts: 8,
      timeoutMs: 120000,
      intervalMs: 4000,
      successCallback: (qrCode) => {
        setSelectedQRCode(qrCode);
      }
    });
  }, [currentInstanceId, startPolling, resetPolling]);

  const syncPendingInstances = useCallback(async () => {
    console.log('[Instances Hook] 🔄 HÍBRIDO: Sincronizando instâncias pendentes...');
    await fetchInstances();
  }, [fetchInstances]);

  return {
    instances,
    isLoading,
    isConnecting,
    error,
    
    // HÍBRIDO: Estados do modal
    showQRModal,
    selectedQRCode,
    selectedInstanceName,
    
    // HÍBRIDO: Estados do polling
    isPolling,
    currentAttempt,
    isWaiting,
    maxAttempts: 8,
    
    // Métodos
    refetch: fetchInstances,
    createInstance,
    deleteInstance,
    refreshQRCode,
    closeQRModal,
    retryQRCode,
    syncPendingInstances
  };
};
