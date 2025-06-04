
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppWebInstance } from './types/whatsappWebTypes';
import { useIntelligentSync } from './services/intelligentSyncService';
import { useInstanceDatabase } from './services/instanceDatabaseService';
import { useInstanceActions } from './services/instanceActionsService';
import { useAutoConnect } from './services/autoConnectService';
import { useConnectionStatusManager } from './services/connectionStatusService';
import { useWhatsAppLogging } from './services/enhancedLoggingService';
import { VPS_CONFIG, validateVPSHealth } from '@/services/whatsapp/config/vpsConfig';

export type { WhatsAppWebInstance } from './types/whatsappWebTypes';

// FASE 2: Hook principal otimizado com sync inteligente e logs detalhados
export const useWhatsAppWebInstances = (companyId: string | null, companyLoading: boolean) => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vpsHealthy, setVpsHealthy] = useState<boolean>(true);
  const [syncStats, setSyncStats] = useState<any>(null);
  
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const healthCheckIntervalRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);
  
  // Use enhanced services - FASE 2
  const { performIntelligentSync, forceFullSync, cleanup: syncCleanup, isInProgress, getLastSyncInfo } = useIntelligentSync(companyId, companyLoading);
  const { fetchInstances: fetchInstancesFromDB } = useInstanceDatabase(companyId, companyLoading);
  const { updateInstanceStatus, getInstanceStatus, cleanup: statusCleanup } = useConnectionStatusManager();
  const { logSyncOperation, logError } = useWhatsAppLogging();

  // Enhanced fetch instances with status management
  const fetchInstances = async () => {
    if (!isMountedRef.current) return;
    
    try {
      console.log('[Hook FASE 2] 📥 Buscando instâncias otimizado...');
      const startTime = Date.now();
      
      const fetchedInstances = await fetchInstancesFromDB();
      
      if (isMountedRef.current) {
        // Atualizar status de cada instância
        fetchedInstances.forEach(instance => {
          updateInstanceStatus(
            instance.id,
            instance.connection_status || 'disconnected',
            instance.web_status,
            undefined
          );
        });

        const duration = Date.now() - startTime;
        console.log('[Hook FASE 2] ✅ Instâncias carregadas:', {
          count: fetchedInstances.length,
          duration: `${duration}ms`
        });

        setInstances(fetchedInstances);
        setError(null);
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        logError('fetch-instances', error);
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

  // Enhanced VPS health check with detailed logging
  const checkVPSHealth = async () => {
    if (!isMountedRef.current) return;
    
    const startTime = Date.now();
    const health = await validateVPSHealth();
    const duration = Date.now() - startTime;
    
    if (isMountedRef.current) {
      setVpsHealthy(health.healthy);
      
      if (!health.healthy) {
        logError('vps-health-check', { error: health.error, duration });
        setError(health.error || 'VPS não está respondendo');
      }
    }
  };

  // Enhanced cleanup - FASE 2
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log('[Hook FASE 2] 🧹 Iniciando cleanup otimizado...');
      
      // Cleanup services
      syncCleanup();
      statusCleanup();
      
      // Clear intervals
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      
      console.log('[Hook FASE 2] ✅ Cleanup concluído');
    };
  }, [syncCleanup, statusCleanup]);

  // Enhanced auto-sync with intelligent sync - FASE 2
  useEffect(() => {
    if (!companyId || companyLoading) return;

    console.log('[Hook FASE 2] 🧠 Iniciando sync inteligente automático');
    
    // Initial sync
    const initialSync = async () => {
      if (!isMountedRef.current) return;
      
      // Health check first
      await checkVPSHealth();
      
      if (vpsHealthy) {
        const result = await performIntelligentSync(false);
        logSyncOperation('initial', result);
        setSyncStats(result);
      }
      await fetchInstances();
    };
    
    initialSync();
    
    // Intelligent auto-sync with longer interval
    syncIntervalRef.current = setInterval(async () => {
      if (!isMountedRef.current || isInProgress()) return;
      
      console.log('[Hook FASE 2] ⏰ Sync inteligente automático executando...');
      const result = await performIntelligentSync(false);
      
      logSyncOperation('automatic', result);
      setSyncStats(result);
      
      // Só buscar do DB se houve mudanças reais
      if (result.success && !result.skipped) {
        await fetchInstances();
      }
    }, VPS_CONFIG.sync.interval);

    // VPS health check interval
    healthCheckIntervalRef.current = setInterval(async () => {
      if (isMountedRef.current) {
        await checkVPSHealth();
      }
    }, VPS_CONFIG.sync.healthCheckInterval);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      console.log('[Hook FASE 2] 🛑 Auto-sync inteligente parado');
    };
  }, [companyId, companyLoading, performIntelligentSync, vpsHealthy, isInProgress]);

  // Initial load
  useEffect(() => {
    if (companyId && !companyLoading) {
      fetchInstances();
    }
  }, [companyId, companyLoading]);

  // Enhanced realtime subscription - FASE 2
  useEffect(() => {
    if (!companyId) return;

    console.log('[Hook FASE 2] 🔔 Configurando realtime otimizado para empresa:', companyId);

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
          console.log('[Hook FASE 2] 📡 Realtime update:', payload.eventType);
          
          if (isMountedRef.current) {
            // Usar sync inteligente em vez de sync forçado
            performIntelligentSync(false).then(result => {
              logSyncOperation('realtime-triggered', result);
              if (result.success && !result.skipped) {
                fetchInstances();
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[Hook FASE 2] 🔕 Limpando realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [companyId, performIntelligentSync]);

  // Enhanced refetch function - FASE 2
  const refetch = async () => {
    console.log('[Hook FASE 2] 🔄 Refetch manual otimizado solicitado');
    
    // Health check first
    await checkVPSHealth();
    
    if (vpsHealthy) {
      const result = await forceFullSync(); // Force full sync for manual refresh
      logSyncOperation('manual-refetch', result);
      setSyncStats(result);
    }
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
    refetch,
    // FASE 2: Novos campos para monitoramento avançado
    vpsHealthy,
    isInProgress: isInProgress(),
    checkVPSHealth,
    syncStats,
    getLastSyncInfo: getLastSyncInfo(),
    getInstanceStatus: (id: string) => getInstanceStatus(id)
  };
};
