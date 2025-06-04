
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppWebInstance } from './types/whatsappWebTypes';
import { useIntelligentSync } from './services/intelligentSyncService';
import { useInstanceDatabase } from './services/instanceDatabaseService';
import { useInstanceActions } from './services/instanceActionsService';
import { useAutoConnect } from './services/autoConnectService';
import { useConnectionStatusManager } from './services/connectionStatusService';
import { useWhatsAppLogging } from './services/enhancedLoggingService';
import { useStabilityService } from './services/stabilityService';
import { VPS_CONFIG, validateVPSHealth } from '@/services/whatsapp/config/vpsConfig';

export type { WhatsAppWebInstance } from './types/whatsappWebTypes';

// FASE 3: Hook com sistema de estabilidade anti-loop
export const useWhatsAppWebInstances = (companyId: string | null, companyLoading: boolean) => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState<any>(null);
  
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const healthCheckIntervalRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);
  
  // NOVO: Serviço de estabilidade
  const { 
    shouldAllowOperation, 
    reportHealthCheck, 
    forceReset, 
    getStabilityState,
    cleanup: stabilityCleanup 
  } = useStabilityService();
  
  // Use enhanced services
  const { performIntelligentSync, forceFullSync, cleanup: syncCleanup, isInProgress, getLastSyncInfo } = useIntelligentSync(companyId, companyLoading);
  const { fetchInstances: fetchInstancesFromDB } = useInstanceDatabase(companyId, companyLoading);
  const { updateInstanceStatus, getInstanceStatus, cleanup: statusCleanup } = useConnectionStatusManager();
  const { logSyncOperation, logError } = useWhatsAppLogging();

  // Enhanced fetch instances com validação de estabilidade
  const fetchInstances = async () => {
    if (!isMountedRef.current || !shouldAllowOperation('fetch')) return;
    
    try {
      console.log('[Hook FASE 3] 📥 Buscando instâncias com controle de estabilidade...');
      const startTime = Date.now();
      
      const fetchedInstances = await fetchInstancesFromDB();
      
      if (isMountedRef.current) {
        fetchedInstances.forEach(instance => {
          updateInstanceStatus(
            instance.id,
            instance.connection_status || 'disconnected',
            instance.web_status,
            undefined
          );
        });

        const duration = Date.now() - startTime;
        console.log('[Hook FASE 3] ✅ Instâncias carregadas:', {
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

  // Enhanced VPS health check com sistema de estabilidade
  const checkVPSHealth = async () => {
    if (!isMountedRef.current || !shouldAllowOperation('health')) return;
    
    const startTime = Date.now();
    
    try {
      const health = await validateVPSHealth();
      const duration = Date.now() - startTime;
      
      if (isMountedRef.current) {
        reportHealthCheck(health.healthy, health.error);
        
        if (!health.healthy) {
          setError(health.error || 'VPS não está respondendo');
        } else {
          setError(null);
        }
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        reportHealthCheck(false, error.message);
        setError(error.message);
      }
    }
  };

  // Enhanced cleanup com sistema de estabilidade
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log('[Hook FASE 3] 🧹 Iniciando cleanup com sistema de estabilidade...');
      
      // Cleanup all services
      syncCleanup();
      statusCleanup();
      stabilityCleanup();
      
      // Clear intervals
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      
      console.log('[Hook FASE 3] ✅ Cleanup concluído');
    };
  }, [syncCleanup, statusCleanup, stabilityCleanup]);

  // Sistema de auto-sync inteligente com controle de estabilidade
  useEffect(() => {
    if (!companyId || companyLoading) return;

    console.log('[Hook FASE 3] 🛡️ Iniciando sistema protegido contra loops');
    
    // Initial operations
    const initialOperations = async () => {
      if (!isMountedRef.current) return;
      
      // Health check first
      await checkVPSHealth();
      
      // Only sync if VPS is healthy
      const stabilityState = getStabilityState();
      if (stabilityState.isVPSHealthy && shouldAllowOperation('sync')) {
        const result = await performIntelligentSync(false);
        logSyncOperation('initial', result);
        setSyncStats(result);
      }
      
      await fetchInstances();
    };
    
    initialOperations();
    
    // Controlled auto-sync with stability checks
    syncIntervalRef.current = setInterval(async () => {
      if (!isMountedRef.current || isInProgress()) return;
      
      const stabilityState = getStabilityState();
      
      // Só executar sync se estável e permitido
      if (stabilityState.isVPSHealthy && shouldAllowOperation('sync')) {
        console.log('[Hook FASE 3] ⏰ Auto-sync controlado executando...');
        const result = await performIntelligentSync(false);
        
        logSyncOperation('automatic', result);
        setSyncStats(result);
        
        if (result.success && !result.skipped) {
          await fetchInstances();
        }
      } else {
        console.log('[Hook FASE 3] ⏸️ Auto-sync suspenso - aguardando estabilidade');
      }
    }, VPS_CONFIG.sync.interval);

    // Controlled health check interval
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
      console.log('[Hook FASE 3] 🛑 Sistema de auto-sync protegido parado');
    };
  }, [companyId, companyLoading, performIntelligentSync, isInProgress, shouldAllowOperation, getStabilityState]);

  // Initial load
  useEffect(() => {
    if (companyId && !companyLoading) {
      fetchInstances();
    }
  }, [companyId, companyLoading]);

  // Realtime subscription com controle de estabilidade
  useEffect(() => {
    if (!companyId) return;

    console.log('[Hook FASE 3] 🔔 Configurando realtime protegido para empresa:', companyId);

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
          console.log('[Hook FASE 3] 📡 Realtime update:', payload.eventType);
          
          if (isMountedRef.current) {
            const stabilityState = getStabilityState();
            
            // Só processar se estável
            if (stabilityState.isVPSHealthy && shouldAllowOperation('sync')) {
              performIntelligentSync(false).then(result => {
                logSyncOperation('realtime-triggered', result);
                if (result.success && !result.skipped) {
                  fetchInstances();
                }
              });
            } else {
              console.log('[Hook FASE 3] ⏸️ Realtime suspenso - aguardando estabilidade');
              // Apenas fetch local sem sync VPS
              fetchInstances();
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[Hook FASE 3] 🔕 Limpando realtime subscription protegido');
      supabase.removeChannel(channel);
    };
  }, [companyId, performIntelligentSync, shouldAllowOperation, getStabilityState]);

  // Enhanced refetch function com controle de estabilidade
  const refetch = async () => {
    console.log('[Hook FASE 3] 🔄 Refetch manual com controle de estabilidade');
    
    // Health check first
    await checkVPSHealth();
    
    const stabilityState = getStabilityState();
    if (stabilityState.isVPSHealthy && shouldAllowOperation('sync')) {
      const result = await forceFullSync();
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
    // FASE 3: Novos campos de estabilidade
    isInProgress: isInProgress(),
    checkVPSHealth,
    syncStats,
    getLastSyncInfo: getLastSyncInfo(),
    getInstanceStatus: (id: string) => getInstanceStatus(id),
    // Controles de estabilidade
    stabilityState: getStabilityState(),
    forceStabilityReset: forceReset
  };
};
