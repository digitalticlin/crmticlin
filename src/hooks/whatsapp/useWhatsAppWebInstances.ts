
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppWebInstance } from './types/whatsappWebTypes';
import { useInstanceSync } from './services/instanceSyncService';
import { useInstanceDatabase } from './services/instanceDatabaseService';
import { useInstanceActions } from './services/instanceActionsService';
import { useAutoConnect } from './services/autoConnectService';
import { VPS_CONFIG, validateVPSHealth } from '@/services/whatsapp/config/vpsConfig';

export type { WhatsAppWebInstance } from './types/whatsappWebTypes';

// FASE 1: Hook principal melhorado com estabilização
export const useWhatsAppWebInstances = (companyId: string | null, companyLoading: boolean) => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vpsHealthy, setVpsHealthy] = useState<boolean>(true);
  
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const healthCheckIntervalRef = useRef<NodeJS.Timeout>();
  
  // Use modular services
  const { performSync, debouncedSync, isMountedRef, cleanup, isInProgress } = useInstanceSync(companyId, companyLoading);
  const { fetchInstances: fetchInstancesFromDB } = useInstanceDatabase(companyId, companyLoading);

  // Fetch instances wrapper melhorado
  const fetchInstances = async () => {
    if (!isMountedRef.current) return;
    
    try {
      console.log('[Hook] 📥 Buscando instâncias do banco...');
      const fetchedInstances = await fetchInstancesFromDB();
      
      if (isMountedRef.current) {
        console.log('[Hook] ✅ Instâncias carregadas:', fetchedInstances.length);
        setInstances(fetchedInstances);
        setError(null);
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        console.error('[Hook] ❌ Erro ao buscar instâncias:', error);
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

  // Health check da VPS - NOVO
  const checkVPSHealth = async () => {
    if (!isMountedRef.current) return;
    
    const health = await validateVPSHealth();
    if (isMountedRef.current) {
      setVpsHealthy(health.healthy);
      if (!health.healthy) {
        console.warn('[Hook] ⚠️ VPS não saudável:', health.error);
        setError(health.error || 'VPS não está respondendo');
      }
    }
  };

  // Cleanup on unmount - MELHORADO
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log('[Hook] 🧹 Iniciando cleanup completo...');
      
      // Cleanup sync service
      cleanup();
      
      // Clear intervals
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      
      console.log('[Hook] ✅ Cleanup concluído');
    };
  }, [cleanup]);

  // Auto-sync com intervalo estabilizado - FASE 1
  useEffect(() => {
    if (!companyId || companyLoading) return;

    console.log('[Hook] 🔄 Iniciando auto-sync estabilizado (Fase 1)');
    console.log('[Hook] ⚙️ Configurações:', {
      intervalo: VPS_CONFIG.sync.interval / 1000 + 's',
      healthCheck: VPS_CONFIG.sync.healthCheckInterval / 1000 + 's'
    });
    
    // Sync inicial
    const initialSync = async () => {
      if (!isMountedRef.current) return;
      
      // Verificar saúde da VPS antes do sync
      await checkVPSHealth();
      
      if (vpsHealthy) {
        await performSync(false);
      }
      await fetchInstances();
    };
    
    initialSync();
    
    // Auto-sync com intervalo reduzido (3 minutos)
    syncIntervalRef.current = setInterval(async () => {
      if (!isMountedRef.current || isInProgress()) return;
      
      console.log('[Hook] ⏰ Auto-sync programado executando...');
      const syncSuccess = await performSync(false);
      if (syncSuccess) {
        await fetchInstances();
      }
    }, VPS_CONFIG.sync.interval);

    // Health check da VPS a cada minuto
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
      console.log('[Hook] 🛑 Auto-sync parado');
    };
  }, [companyId, companyLoading, performSync, vpsHealthy, isInProgress]);

  // Initial load
  useEffect(() => {
    if (companyId && !companyLoading) {
      fetchInstances();
    }
  }, [companyId, companyLoading]);

  // Realtime subscription com debounce - MELHORADO
  useEffect(() => {
    if (!companyId) return;

    console.log('[Hook] 🔔 Configurando realtime subscription para empresa:', companyId);

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
          console.log('[Hook] 📡 Realtime update recebido:', payload.eventType);
          
          if (isMountedRef.current) {
            // Usar debounced sync para evitar múltiplas atualizações
            debouncedSync(false);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[Hook] 🔕 Limpando realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [companyId, debouncedSync]);

  // Refetch function melhorado
  const refetch = async () => {
    console.log('[Hook] 🔄 Refetch manual solicitado');
    
    // Verificar saúde da VPS primeiro
    await checkVPSHealth();
    
    if (vpsHealthy) {
      await performSync(true); // Force sync
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
    // NOVOS campos para monitoramento
    vpsHealthy,
    isInProgress: isInProgress(),
    checkVPSHealth
  };
};
