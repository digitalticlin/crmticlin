
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';
import { supabase } from '@/integrations/supabase/client';

export interface WhatsAppWebInstance {
  id: string;
  instance_name: string;
  connection_type: string;
  server_url: string;
  vps_instance_id: string;
  web_status: string;
  connection_status: string;
  qr_code?: string | null;
  phone?: string | null;
  profile_name?: string | null;
  company_id: string;
}

interface AutoConnectState {
  isConnecting: boolean;
  showQRModal: boolean;
  activeInstanceId: string | null;
}

export const useWhatsAppWebInstances = (companyId: string | null, companyLoading: boolean) => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastSyncRef = useRef<number>(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);
  
  const [autoConnectState, setAutoConnectState] = useState<AutoConnectState>({
    isConnecting: false,
    showQRModal: false,
    activeInstanceId: null,
  });

  // Cleanup no unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      console.log('[Hook] Component unmounting - cleanup completed');
    };
  }, []);

  // Função de sync mais conservadora
  const performSync = useCallback(async (force = false) => {
    if (!companyId || companyLoading || !isMountedRef.current) {
      console.log('[Hook] ⏭️ Skipping sync - conditions not met:', { companyId: !!companyId, companyLoading, mounted: isMountedRef.current });
      return;
    }

    const now = Date.now();
    const timeSinceLastSync = now - lastSyncRef.current;
    const MIN_SYNC_INTERVAL = 10000; // 10 segundos

    if (!force && timeSinceLastSync < MIN_SYNC_INTERVAL) {
      console.log(`[Hook] ⏰ Sync throttled - ${Math.round((MIN_SYNC_INTERVAL - timeSinceLastSync) / 1000)}s remaining`);
      return;
    }

    try {
      console.log('[Hook] 🔄 Iniciando sync conservador das instâncias');
      lastSyncRef.current = now;

      const result = await WhatsAppWebService.syncInstances();
      
      if (!isMountedRef.current) {
        console.log('[Hook] Component unmounted during sync');
        return;
      }

      if (result.success) {
        console.log('[Hook] ✅ Sync successful:', result.data?.summary);
        await fetchInstances(); // Recarregar após sync
      } else {
        console.error('[Hook] ❌ Sync failed:', result.error);
        // Não mostrar erro para o usuário em sync automático
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('[Hook] ❌ Sync error:', error);
      }
    }
  }, [companyId, companyLoading]);

  // Auto-sync com intervalo mais espaçado
  useEffect(() => {
    if (!companyId || companyLoading) return;

    console.log('[Hook] 🔄 Auto-sync das instâncias iniciado');
    
    // Sync inicial
    performSync(false);
    
    // Auto-sync a cada 30 segundos (reduzido de frequência)
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        performSync(false);
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      console.log('[Hook] 🛑 Auto-sync parado');
    };
  }, [companyId, companyLoading, performSync]);

  // Fetch instances from database
  const fetchInstances = useCallback(async () => {
    if (!companyId || companyLoading) {
      console.log('[Hook] ⏭️ Fetch skipped - no company ID or loading');
      return;
    }

    try {
      console.log('[Hook] 📊 Fetching instances from database for company:', companyId);
      
      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', companyId)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (!isMountedRef.current) return;

      if (fetchError) {
        throw fetchError;
      }

      const mappedInstances: WhatsAppWebInstance[] = (data || []).map(instance => ({
        id: instance.id,
        instance_name: instance.instance_name,
        connection_type: instance.connection_type || 'web',
        server_url: instance.server_url || '',
        vps_instance_id: instance.vps_instance_id || '',
        web_status: instance.web_status || '',
        connection_status: instance.connection_status || '',
        qr_code: instance.qr_code,
        phone: instance.phone,
        profile_name: instance.profile_name,
        company_id: instance.company_id
      }));

      setInstances(mappedInstances);
      setError(null);
      
      console.log(`✅ Instâncias carregadas: ${mappedInstances.length} (modo permanente)`);
      
    } catch (error: any) {
      if (isMountedRef.current) {
        console.error('[Hook] ❌ Error fetching instances:', error);
        setError(error.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [companyId, companyLoading]);

  // Initial load
  useEffect(() => {
    if (companyId && !companyLoading) {
      fetchInstances();
    }
  }, [companyId, companyLoading, fetchInstances]);

  // Realtime subscription with better error handling
  useEffect(() => {
    if (!companyId) return;

    console.log('[Hook] 🔔 Setting up realtime subscription for company:', companyId);

    const channel = supabase
      .channel(`whatsapp-instances-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          console.log('[Hook] 📡 Realtime update received:', payload.eventType);
          
          if (isMountedRef.current) {
            // Debounced refetch
            if (syncTimeoutRef.current) {
              clearTimeout(syncTimeoutRef.current);
            }
            
            syncTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                console.log('[Hook] 🔄 Realtime triggered refetch');
                fetchInstances();
              }
            }, 1000);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[Hook] 🔕 Cleaning up realtime subscription');
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [companyId, fetchInstances]);

  // Create instance with better error handling
  const createInstance = useCallback(async (instanceName: string) => {
    try {
      console.log('[Hook] 🆕 Creating instance:', instanceName);
      
      const result = await WhatsAppWebService.createInstance(instanceName);
      
      if (result.success && result.instance) {
        console.log('[Hook] ✅ Instance created successfully');
        toast.success(`Instância "${instanceName}" criada com sucesso!`);
        await fetchInstances();
        return result.instance;
      } else {
        throw new Error(result.error || 'Failed to create instance');
      }
    } catch (error: any) {
      console.error('[Hook] ❌ Create instance error:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
      throw error;
    }
  }, [fetchInstances]);

  // Delete instance with confirmation
  const deleteInstance = useCallback(async (instanceId: string) => {
    try {
      console.log('[Hook] 🗑️ Deleting instance:', instanceId);
      
      const result = await WhatsAppWebService.deleteInstance(instanceId);
      
      if (result.success) {
        console.log('[Hook] ✅ Instance deleted successfully');
        toast.success('Instância removida com sucesso!');
        await fetchInstances();
      } else {
        throw new Error(result.error || 'Failed to delete instance');
      }
    } catch (error: any) {
      console.error('[Hook] ❌ Delete instance error:', error);
      toast.error(`Erro ao remover instância: ${error.message}`);
    }
  }, [fetchInstances]);

  // Refresh QR code
  const refreshQRCode = useCallback(async (instanceId: string) => {
    try {
      console.log('[Hook] 🔄 Refreshing QR code for:', instanceId);
      
      const result = await WhatsAppWebService.getQRCode(instanceId);
      
      if (result.success && result.qrCode) {
        console.log('[Hook] ✅ QR code refreshed');
        toast.success('QR Code atualizado!');
        await fetchInstances();
        return result.qrCode;
      } else {
        throw new Error(result.error || 'Failed to get QR code');
      }
    } catch (error: any) {
      console.error('[Hook] ❌ Refresh QR error:', error);
      toast.error(`Erro ao atualizar QR Code: ${error.message}`);
      return null;
    }
  }, [fetchInstances]);

  // Auto connection flow
  const startAutoConnection = useCallback(async () => {
    try {
      setAutoConnectState(prev => ({ ...prev, isConnecting: true }));
      
      const instanceName = `whatsapp_${Date.now()}`;
      const instance = await createInstance(instanceName);
      
      if (instance && instance.qr_code) {
        setAutoConnectState({
          isConnecting: false,
          showQRModal: true,
          activeInstanceId: instance.id
        });
      }
    } catch (error) {
      setAutoConnectState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [createInstance]);

  const closeQRModal = useCallback(() => {
    setAutoConnectState(prev => ({ 
      ...prev, 
      showQRModal: false, 
      activeInstanceId: null 
    }));
  }, []);

  const openQRModal = useCallback((instanceId: string) => {
    setAutoConnectState(prev => ({ 
      ...prev, 
      showQRModal: true, 
      activeInstanceId: instanceId 
    }));
  }, []);

  // Refetch function
  const refetch = useCallback(() => {
    console.log('[Hook] 🔄 Manual refetch requested');
    return performSync(true);
  }, [performSync]);

  return {
    instances,
    loading,
    error,
    createInstance,
    deleteInstance,
    refreshQRCode,
    startAutoConnection,
    closeQRModal,
    openQRModal,
    autoConnectState,
    refetch
  };
};
