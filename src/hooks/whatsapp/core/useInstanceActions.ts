
import { toast } from 'sonner';
import { WhatsAppInstance, useWhatsAppInstanceState } from '../whatsappInstanceStore';
import { useWhatsAppConnector } from '../useWhatsAppConnector';
import { useWhatsAppDisconnector } from '../useWhatsAppDisconnector';
import { useWhatsAppStatusMonitor } from '../useWhatsAppStatusMonitor';
import { useWhatsAppFetcher } from '../useWhatsAppFetcher';
import { useInstanceLoadingState } from './useInstanceLoadingState';

interface UseInstanceActionsProps {
  instances: WhatsAppInstance[];
  companyId: string | null;
  loadingState: ReturnType<typeof useInstanceLoadingState>;
}

export const useInstanceActions = ({ instances, companyId, loadingState }: UseInstanceActionsProps) => {
  const { setInstances } = useWhatsAppInstanceState();
  const { connectInstance } = useWhatsAppConnector();
  const { deleteInstance } = useWhatsAppDisconnector();
  const { addConnectingInstance } = useWhatsAppStatusMonitor();
  const { fetchInstances } = useWhatsAppFetcher();
  
  const {
    setInstanceLoading,
    updateLastError,
    isUnmountedRef
  } = loadingState;

  const handleConnectInstance = async (instanceId: string | WhatsAppInstance): Promise<string | undefined> => {
    if (isUnmountedRef.current) return;
    
    try {
      console.log('[useInstanceActions] Connect instance requested:', typeof instanceId === 'string' ? instanceId : instanceId.id);
      
      // Check if instanceId is a string or a WhatsAppInstance object
      const instanceToConnect = typeof instanceId === 'string' 
        ? instances.find(i => i.id === instanceId) 
        : instanceId;
        
      if (!instanceToConnect) {
        throw new Error("Instance not found");
      }
      
      setInstanceLoading(instanceToConnect.id, true);
      updateLastError(null);
      
      const qrCodeUrl = await connectInstance(instanceToConnect);
      
      if (!isUnmountedRef.current) {
        // Mark this instance as connecting to trigger more frequent status checks
        addConnectingInstance(instanceToConnect.id);
      }
      
      return qrCodeUrl;
    } catch (error: any) {
      if (!isUnmountedRef.current) {
        console.error("Error connecting instance:", error);
        updateLastError(error?.message || "Error connecting WhatsApp instance");
      }
      return undefined;
    } finally {
      if (!isUnmountedRef.current) {
        const id = typeof instanceId === 'string' ? instanceId : instanceId.id;
        setInstanceLoading(id, false);
      }
    }
  };

  const handleRefreshQrCode = async (instanceId: string) => {
    if (isUnmountedRef.current) return;
    
    try {
      console.log('[useInstanceActions] Refresh QR code requested for:', instanceId);
      setInstanceLoading(instanceId, true);
      updateLastError(null);
      
      const instance = instances.find(i => i.id === instanceId);
      if (!instance) {
        throw new Error("Instance not found");
      }
      
      // Using connectInstance instead of refreshQrCode to get a completely new code
      await connectInstance(instance);
      
      if (!isUnmountedRef.current) {
        // Mark this instance for priority status checking
        addConnectingInstance(instanceId);
      }
    } catch (error: any) {
      if (!isUnmountedRef.current) {
        console.error("Error updating QR code:", error);
        updateLastError(error?.message || "Error updating QR code");
      }
    } finally {
      if (!isUnmountedRef.current) {
        setInstanceLoading(instanceId, false);
      }
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    if (isUnmountedRef.current) return;
    
    try {
      console.log('[useInstanceActions] Delete instance requested for:', instanceId);
      setInstanceLoading(instanceId, true);
      updateLastError(null);

      // Remove imediatamente do estado local antes de qualquer requisição
      setInstances(instances.filter(i => i.id !== instanceId));

      const instance = instances.find(i => i.id === instanceId);
      if (!instance) {
        // Caso não exista mais, já retorna
        return;
      }

      // Tenta apagar na Evolution e Supabase
      await deleteInstance(instance);

      // Força refetch para garantir sync do backend
      if (companyId && !isUnmountedRef.current) {
        await fetchInstances(companyId);
      }

      if (!isUnmountedRef.current) {
        toast.success("WhatsApp successfully disconnected!");
      }
    } catch (error: any) {
      // Mesmo se ocorrer erro, NÃO repopula o card no estado/local.
      if (!isUnmountedRef.current) {
        console.error("Error deleting instance:", error);
        updateLastError(error?.message || "Error deleting WhatsApp instance");
      }
      // Não faz mais nada: o card já saiu da interface
    } finally {
      if (!isUnmountedRef.current) {
        setInstanceLoading(instanceId, false);
      }
    }
  };

  return {
    connectInstance: handleConnectInstance,
    refreshQrCode: handleRefreshQrCode,
    deleteInstance: handleDeleteInstance
  };
};
