import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { ConnectionHealthService } from "@/services/whatsapp/services/connectionHealthService";
import { toast } from "sonner";

export interface WhatsAppWebInstance {
  id: string;
  instance_name: string;
  connection_type: string;
  server_url: string;
  vps_instance_id: string;
  web_status: string;
  connection_status: string;
  qr_code?: string;
  phone?: string;
  profile_name?: string;
  company_id: string;
  date_connected?: string;
}

export interface AutoConnectState {
  isConnecting: boolean;
  showQRModal: boolean;
  activeInstanceId: string | null;
  error: string | null;
}

export const useWhatsAppWebInstances = (companyId?: string, companyLoading?: boolean) => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoConnectState, setAutoConnectState] = useState<AutoConnectState>({
    isConnecting: false,
    showQRModal: false,
    activeInstanceId: null,
    error: null
  });

  const generateInstanceName = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `whatsapp_${timestamp}_${random}`;
  };

  const fetchInstances = async () => {
    if (!companyId) {
      setInstances([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[useWhatsAppWebInstances] Fetching instances for company:', companyId);

      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', companyId)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[useWhatsAppWebInstances] Fetch error:', fetchError);
        throw new Error(fetchError.message);
      }

      console.log('[useWhatsAppWebInstances] Fetched instances:', data);
      setInstances(data || []);

      // Start health monitoring for truly connected instances
      if (data) {
        data.forEach(instance => {
          if (instance.vps_instance_id && 
              ['ready', 'open'].includes(instance.web_status || '') &&
              instance.phone && instance.phone !== '') {
            console.log('[useWhatsAppWebInstances] Starting health monitoring for CONNECTED instance:', instance.id);
            ConnectionHealthService.startHealthMonitoring(instance.id, instance.vps_instance_id);
          } else {
            console.log('[useWhatsAppWebInstances] Skipping health monitoring for non-connected instance:', instance.id, 'Status:', instance.web_status);
          }
        });
      }
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

      const instanceName = generateInstanceName();
      console.log('[useWhatsAppWebInstances] Generated instance name:', instanceName);
      
      const result = await WhatsAppWebService.createInstance(instanceName);
      console.log('[useWhatsAppWebInstances] Create instance result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Falha ao criar instância');
      }

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
      
      const result = await WhatsAppWebService.createInstance(instanceName);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create instance');
      }

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
      
      // Para monitoramento de saúde antes de deletar
      console.log('[useWhatsAppWebInstances] Stopping health monitoring for:', instanceId);
      ConnectionHealthService.stopHealthMonitoring(instanceId);
      
      const result = await WhatsAppWebService.deleteInstance(instanceId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete instance');
      }

      toast.success('Instância removida com sucesso!');
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

      const result = await WhatsAppWebService.getQRCode(instance.vps_instance_id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get QR code');
      }

      setInstances(prev => prev.map(i => 
        i.id === instanceId 
          ? { ...i, qr_code: result.qrCode } 
          : i
      ));

      return result.qrCode;
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

      console.log('[useWhatsAppWebInstances] Syncing status for instance:', instanceId);

      const result = await WhatsAppWebService.syncInstanceStatus(instance.vps_instance_id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to sync status');
      }

      console.log('[useWhatsAppWebInstances] Sync result:', result);

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

      console.log('[useWhatsAppWebInstances] Force syncing instance:', instanceId);

      const result = await WhatsAppWebService.forceSync(instance.vps_instance_id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to force sync');
      }

      console.log('[useWhatsAppWebInstances] Force sync result:', result);

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
      const result = await WhatsAppWebService.sendMessage(instanceId, phone, message);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      return true;
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

    // NOVO: Auto-sync imediato após fechar modal
    if (autoConnectState.activeInstanceId) {
      console.log('[useWhatsAppWebInstances] Auto-syncing after closing QR modal for instance:', autoConnectState.activeInstanceId);
      setTimeout(() => {
        syncInstanceStatus(autoConnectState.activeInstanceId!).catch(err => {
          console.error('[useWhatsAppWebInstances] Auto-sync after QR close failed:', err);
        });
      }, 2000); // Aguarda 2 segundos para o usuário fechar o modal e escanear
    }
  };

  const openQRModal = (instanceId: string) => {
    setAutoConnectState(prev => ({ 
      ...prev, 
      showQRModal: true,
      activeInstanceId: instanceId 
    }));
  };

  // Cleanup - para todos os monitoramentos ao desmontar
  useEffect(() => {
    return () => {
      console.log('[useWhatsAppWebInstances] Stopping all health monitoring on unmount');
      ConnectionHealthService.stopAllMonitoring();
    };
  }, []);

  // POLLING INTELIGENTE APRIMORADO - mais agressivo para instâncias críticas
  useEffect(() => {
    if (!companyId || instances.length === 0) return;

    // Instâncias que precisam de sync mais frequente
    const criticalInstances = instances.filter(instance => {
      return ['waiting_scan', 'connecting', 'creating'].includes(instance.web_status || '') && 
             instance.vps_instance_id;
    });

    if (criticalInstances.length === 0) {
      console.log('[useWhatsAppWebInstances] No critical instances - no intensive polling needed');
      return;
    }

    console.log('[useWhatsAppWebInstances] Setting up INTENSIVE polling for', criticalInstances.length, 'critical instances');

    const pollInterval = setInterval(async () => {
      console.log('[useWhatsAppWebInstances] Intensive polling check for critical instances...');
      
      for (const instance of criticalInstances) {
        try {
          console.log('[useWhatsAppWebInstances] Auto-syncing critical instance:', instance.id, 'Status:', instance.web_status);
          await syncInstanceStatus(instance.id);
        } catch (error) {
          console.error('[useWhatsAppWebInstances] Intensive polling error for instance:', instance.id, error);
        }
      }
    }, 8000); // 8 segundos para instâncias críticas

    // Auto-cleanup após 10 minutos para evitar polling infinito
    const timeout = setTimeout(() => {
      console.log('[useWhatsAppWebInstances] Auto-stopping intensive polling after 10 minutes');
      clearInterval(pollInterval);
    }, 600000); // 10 minutos

    return () => {
      console.log('[useWhatsAppWebInstances] Cleaning up intensive polling interval');
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [instances, companyId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!companyId) return;

    console.log('[useWhatsAppWebInstances] Setting up realtime subscription for company:', companyId);

    const channel = supabase
      .channel('whatsapp-web-instances')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          console.log('[useWhatsAppWebInstances] Realtime change received:', payload);
          
          // Immediate refresh for real-time responsiveness
          setTimeout(() => {
            fetchInstances();
          }, 1000);
        }
      )
      .subscribe((status) => {
        console.log('[useWhatsAppWebInstances] Realtime subscription status:', status);
      });

    return () => {
      console.log('[useWhatsAppWebInstances] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  // Initial fetch
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
    deleteInstance: async (instanceId: string) => {
      try {
        setLoading(true);
        
        console.log('[useWhatsAppWebInstances] Stopping health monitoring for:', instanceId);
        ConnectionHealthService.stopHealthMonitoring(instanceId);
        
        const result = await WhatsAppWebService.deleteInstance(instanceId);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete instance');
        }

        toast.success('Instância removida com sucesso!');
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
    },
    refreshQRCode: async (instanceId: string) => {
      try {
        const instance = instances.find(i => i.id === instanceId);
        if (!instance?.vps_instance_id) {
          throw new Error('Instance not found');
        }

        console.log('[useWhatsAppWebInstances] MANUAL QR refresh for instance:', instanceId);

        const result = await WhatsAppWebService.getQRCode(instance.vps_instance_id);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to get QR code');
        }

        setInstances(prev => prev.map(i => 
          i.id === instanceId 
            ? { ...i, qr_code: result.qrCode } 
            : i
        ));

        return result.qrCode;
      } catch (err) {
        console.error('[useWhatsAppWebInstances] Error refreshing QR code:', err);
        toast.error('Erro ao atualizar QR code');
        throw err;
      }
    },
    syncInstanceStatus,
    forceSync,
    sendMessage: async (instanceId: string, phone: string, message: string) => {
      try {
        const result = await WhatsAppWebService.sendMessage(instanceId, phone, message);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to send message');
        }

        return true;
      } catch (err) {
        console.error('[useWhatsAppWebInstances] Error sending message:', err);
        toast.error('Erro ao enviar mensagem');
        throw err;
      }
    },
    startAutoConnection,
    closeQRModal,
    openQRModal,
    refetch: fetchInstances
  };
};
