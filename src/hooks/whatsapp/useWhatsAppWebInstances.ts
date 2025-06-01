
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { WhatsAppWebInstance, AutoConnectState } from "./types/whatsappWebInstanceTypes";
import { InstanceService } from "./services/instanceService";
import { InstanceDataService } from "./services/instanceDataService";
import { PollingService } from "./services/pollingService";
import { HealthMonitoringService } from "./services/healthMonitoringService";
import { useCompanyData } from "@/hooks/useCompanyData";

export const useWhatsAppWebInstances = () => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoConnectState, setAutoConnectState] = useState<AutoConnectState>({
    isConnecting: false,
    showQRModal: false,
    activeInstanceId: null,
    error: null
  });

  const { companyId, loading: companyLoading } = useCompanyData();

  const fetchInstances = async () => {
    if (!companyId) {
      setInstances([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await InstanceDataService.fetchInstances(companyId);
      setInstances(data);

      // Start health monitoring for connected instances
      HealthMonitoringService.startMonitoringForInstances(data);
    } catch (err) {
      console.error('[useWhatsAppWebInstances] Error fetching instances:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const startAutoConnection = async () => {
    try {
      console.log('[useWhatsAppWebInstances] Starting auto connection...');
      setAutoConnectState(prev => ({ 
        ...prev, 
        isConnecting: true, 
        error: null 
      }));

      const result = await InstanceService.createInstance();

      const newInstanceId = result.instance?.id;
      console.log('[useWhatsAppWebInstances] New instance ID:', newInstanceId);
      
      if (newInstanceId) {
        setAutoConnectState(prev => ({
          ...prev,
          activeInstanceId: newInstanceId,
          showQRModal: true
        }));
      }

      toast.success('Instância criada! Escaneie o QR code para conectar.');
      
      setTimeout(() => {
        fetchInstances();
      }, 1000);

    } catch (error) {
      console.error('[useWhatsAppWebInstances] Error in auto connect:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setAutoConnectState(prev => ({
        ...prev,
        error: errorMessage,
        isConnecting: false
      }));
      
      toast.error(errorMessage);
    } finally {
      setAutoConnectState(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const createInstance = async (instanceName: string): Promise<void> => {
    try {
      setLoading(true);
      
      await InstanceService.createInstance(instanceName);
      toast.success('Instância WhatsApp criada com sucesso!');
      await fetchInstances();
      
    } catch (err) {
      console.error('[useWhatsAppWebInstances] Error creating instance:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar instância';
      toast.error(errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    try {
      setLoading(true);
      
      HealthMonitoringService.stopMonitoringForInstance(instanceId);
      await InstanceService.deleteInstance(instanceId);
      await fetchInstances();
      
    } catch (err) {
      console.error('[useWhatsAppWebInstances] Error deleting instance:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover instância';
      toast.error(errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshQRCode = async (instanceId: string) => {
    try {
      const instance = instances.find(i => i.id === instanceId);
      if (!instance?.vps_instance_id) {
        throw new Error('Instance not found');
      }

      console.log('[useWhatsAppWebInstances] MANUAL QR refresh for instance:', instanceId);

      const qrCode = await InstanceService.refreshQRCode(instance.vps_instance_id);

      setInstances(prev => prev.map(i => 
        i.id === instanceId 
          ? { ...i, qr_code: qrCode } 
          : i
      ));

      return qrCode;
    } catch (err) {
      console.error('[useWhatsAppWebInstances] Error refreshing QR code:', err);
      toast.error('Erro ao atualizar QR code');
      throw err;
    }
  };

  const syncInstanceStatus = async (instanceId: string) => {
    try {
      const instance = instances.find(i => i.id === instanceId);
      if (!instance?.vps_instance_id) {
        throw new Error('Instance not found');
      }

      const result = await InstanceService.syncInstanceStatus(instance.vps_instance_id);

      if (result.data?.updated) {
        toast.success('Status sincronizado com sucesso!');
        await fetchInstances();
      }

      return result;
    } catch (err) {
      console.error('[useWhatsAppWebInstances] Error syncing status:', err);
      toast.error('Erro ao sincronizar status');
      throw err;
    }
  };

  const forceSync = async (instanceId: string) => {
    try {
      const instance = instances.find(i => i.id === instanceId);
      if (!instance?.vps_instance_id) {
        throw new Error('Instance not found');
      }

      const result = await InstanceService.forceSync(instance.vps_instance_id);
      toast.success('Sincronização forçada realizada com sucesso!');
      await fetchInstances();

      return result;
    } catch (err) {
      console.error('[useWhatsAppWebInstances] Error force syncing:', err);
      toast.error('Erro ao forçar sincronização');
      throw err;
    }
  };

  const sendMessage = async (instanceId: string, phone: string, message: string) => {
    try {
      return await InstanceService.sendMessage(instanceId, phone, message);
    } catch (err) {
      console.error('[useWhatsAppWebInstances] Error sending message:', err);
      toast.error('Erro ao enviar mensagem');
      throw err;
    }
  };

  const closeQRModal = () => {
    setAutoConnectState(prev => ({ 
      ...prev, 
      showQRModal: false,
      activeInstanceId: null 
    }));

    // Auto-sync after closing modal
    if (autoConnectState.activeInstanceId) {
      console.log('[useWhatsAppWebInstances] Auto-syncing after closing QR modal for instance:', autoConnectState.activeInstanceId);
      setTimeout(() => {
        syncInstanceStatus(autoConnectState.activeInstanceId!).catch(err => {
          console.error('[useWhatsAppWebInstances] Auto-sync after QR close failed:', err);
        });
      }, 2000);
    }
  };

  const openQRModal = (instanceId: string) => {
    setAutoConnectState(prev => ({ 
      ...prev, 
      showQRModal: true,
      activeInstanceId: instanceId 
    }));
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      HealthMonitoringService.stopAllMonitoring();
    };
  }, []);

  // Polling effect
  useEffect(() => {
    if (!companyId || instances.length === 0) return;
    return PollingService.setupPolling(instances, companyId);
  }, [instances, companyId]);

  // Realtime subscription effect
  useEffect(() => {
    if (!companyId) return;
    return InstanceDataService.setupRealtimeSubscription(companyId, fetchInstances);
  }, [companyId]);

  // Initial fetch effect
  useEffect(() => {
    if (companyLoading) {
      setLoading(true);
      return;
    }
    
    console.log('[useWhatsAppWebInstances] Fetching instances for company:', companyId);
    fetchInstances();
  }, [companyId, companyLoading]);

  return {
    instances,
    loading,
    error,
    autoConnectState,
    createInstance: startAutoConnection,
    deleteInstance,
    refreshQRCode,
    syncInstanceStatus,
    forceSync,
    sendMessage,
    startAutoConnection,
    closeQRModal,
    openQRModal,
    refetch: fetchInstances
  };
};

// Re-export types for compatibility
export type { WhatsAppWebInstance, AutoConnectState };
