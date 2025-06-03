
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppWebInstance } from './types/whatsappWebTypes';
import { useInstanceSync } from './services/instanceSyncService';
import { useInstanceDatabase } from './services/instanceDatabaseService';
import { useInstanceActions } from './services/instanceActionsService';
import { useAutoConnect } from './services/autoConnectService';

export { WhatsAppWebInstance } from './types/whatsappWebTypes';

export const useWhatsAppWebInstances = (companyId: string | null, companyLoading: boolean) => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Use modular services
  const { performSync, isMountedRef } = useInstanceSync(companyId, companyLoading);
  const { fetchInstances: fetchInstancesFromDB, isMountedRef: dbMountedRef } = useInstanceDatabase(companyId, companyLoading);

  // Fetch instances wrapper
  const fetchInstances = async () => {
    try {
      const fetchedInstances = await fetchInstancesFromDB();
      if (isMountedRef.current) {
        setInstances(fetchedInstances);
        setError(null);
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        setError(error.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Use action services
  const { createInstance, deleteInstance, refreshQRCode } = useInstanceActions(fetchInstances);
  const { autoConnectState, startAutoConnection, closeQRModal, openQRModal } = useAutoConnect(createInstance);

  // Cleanup on unmount
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

  // Auto-sync with interval
  useEffect(() => {
    if (!companyId || companyLoading) return;

    console.log('[Hook] 🔄 Auto-sync das instâncias iniciado');
    
    // Sync inicial and then reload instances
    const initialSync = async () => {
      await performSync(false);
      await fetchInstances();
    };
    
    initialSync();
    
    // Auto-sync a cada 30 segundos
    const interval = setInterval(async () => {
      if (isMountedRef.current) {
        const syncSuccess = await performSync(false);
        if (syncSuccess) {
          await fetchInstances();
        }
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      console.log('[Hook] 🛑 Auto-sync parado');
    };
  }, [companyId, companyLoading, performSync]);

  // Initial load
  useEffect(() => {
    if (companyId && !companyLoading) {
      fetchInstances();
    }
  }, [companyId, companyLoading]);

  // Realtime subscription
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
  }, [companyId]);

  // Refetch function
  const refetch = async () => {
    console.log('[Hook] 🔄 Manual refetch requested');
    await performSync(true);
    await fetchInstances();
  };

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
