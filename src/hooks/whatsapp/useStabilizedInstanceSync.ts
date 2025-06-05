
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyData } from '@/hooks/useCompanyData';
import { toast } from 'sonner';

interface StabilizedSyncState {
  instances: any[];
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  syncCount: number;
  orphanCount: number;
  healthScore: number;
}

/**
 * FASE 1: Hook de Sync Estabilizado com Anti-Órfão
 * - Debounce reduzido (500ms)
 * - Heartbeat a cada 30s
 * - Sistema de adoção de órfãs
 * - Retry automático
 */
export const useStabilizedInstanceSync = () => {
  const [state, setState] = useState<StabilizedSyncState>({
    instances: [],
    isLoading: true,
    error: null,
    lastSync: null,
    syncCount: 0,
    orphanCount: 0,
    healthScore: 100
  });

  const { companyId } = useCompanyData();
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);
  const heartbeatRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  // CORREÇÃO: Sync otimizado com debounce de 500ms
  const performOptimizedSync = useCallback(async (forceRefresh = false): Promise<any[]> => {
    if (!companyId || !isMountedRef.current) {
      return [];
    }

    const now = Date.now();
    const timeSinceLast = now - lastFetchRef.current;
    
    // CORREÇÃO: Debounce reduzido para 500ms para responsividade
    if (!forceRefresh && timeSinceLast < 500) {
      console.log('[Stabilized Sync] ⏸️ Debounce ativo - aguardando', Math.round((500 - timeSinceLast) / 1000), 's');
      return state.instances;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      lastFetchRef.current = now;

      console.log('[Stabilized Sync] 🔄 Executando sync estabilizado para:', companyId);

      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', companyId)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (!isMountedRef.current) return [];

      if (fetchError) {
        throw fetchError;
      }

      const instances = data || [];
      console.log(`[Stabilized Sync] ✅ ${instances.length} instâncias carregadas (responsivo)`);
      
      // Calcular métricas de saúde
      const connectedInstances = instances.filter(i => ['open', 'ready'].includes(i.connection_status));
      const orphanInstances = instances.filter(i => !i.vps_instance_id);
      const healthScore = instances.length > 0 ? Math.round((connectedInstances.length / instances.length) * 100) : 100;

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          instances,
          isLoading: false,
          lastSync: new Date(),
          syncCount: prev.syncCount + 1,
          orphanCount: orphanInstances.length,
          healthScore
        }));

        // Sistema de healing para órfãs
        if (orphanInstances.length > 0) {
          console.warn(`[Stabilized Sync] 🚨 ${orphanInstances.length} instâncias órfãs detectadas`);
          await performOrphanHealing(orphanInstances);
        }
      }
      
      return instances;
      
    } catch (error: any) {
      if (isMountedRef.current) {
        console.error('[Stabilized Sync] ❌ Erro no sync:', error);
        setState(prev => ({
          ...prev,
          error: error.message,
          isLoading: false,
          healthScore: Math.max(0, prev.healthScore - 10)
        }));

        // Retry automático em caso de erro
        scheduleRetry();
      }
      return [];
    }
  }, [companyId, state.instances]);

  // FASE 2: Sistema de cura de órfãs
  const performOrphanHealing = useCallback(async (orphans: any[]) => {
    console.log('[Orphan Healing] 🏥 Iniciando cura de órfãs...');
    
    try {
      // Buscar instâncias ativas na VPS
      const vpsResponse = await fetch('http://31.97.24.222:3001/instances', {
        headers: {
          'Authorization': 'Bearer default-token'
        }
      });

      if (!vpsResponse.ok) {
        console.warn('[Orphan Healing] ⚠️ VPS inacessível para healing');
        return;
      }

      const vpsData = await vpsResponse.json();
      const vpsInstances = vpsData.instances || [];

      console.log(`[Orphan Healing] 📡 ${vpsInstances.length} instâncias encontradas na VPS`);

      // Tentar vincular órfãs com instâncias VPS baseado no phone
      for (const orphan of orphans) {
        const matchingVpsInstance = vpsInstances.find((vps: any) => 
          vps.phone && orphan.phone && vps.phone === orphan.phone
        );

        if (matchingVpsInstance) {
          console.log(`[Orphan Healing] 🔗 Vinculando órfã ${orphan.id} com VPS ${matchingVpsInstance.instanceId}`);
          
          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({
              vps_instance_id: matchingVpsInstance.instanceId,
              connection_status: matchingVpsInstance.status || 'ready',
              web_status: 'connected',
              updated_at: new Date().toISOString()
            })
            .eq('id', orphan.id);

          if (!updateError) {
            console.log(`[Orphan Healing] ✅ Órfã curada: ${orphan.id}`);
          } else {
            console.error(`[Orphan Healing] ❌ Erro ao curar órfã:`, updateError);
          }
        }
      }

      // Refresh após healing
      setTimeout(() => performOptimizedSync(true), 1000);
      
    } catch (error) {
      console.error('[Orphan Healing] 💥 Erro no processo de cura:', error);
    }
  }, []);

  // FASE 1: Sistema de retry automático
  const scheduleRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    retryTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        console.log('[Stabilized Sync] 🔄 Executando retry automático...');
        performOptimizedSync(true);
      }
    }, 5000); // Retry após 5 segundos
  }, [performOptimizedSync]);

  // FASE 1: Heartbeat a cada 30s
  useEffect(() => {
    if (!companyId) return;

    console.log('[Stabilized Sync] 💓 Iniciando heartbeat (30s)');
    
    heartbeatRef.current = setInterval(() => {
      if (isMountedRef.current) {
        console.log('[Stabilized Sync] 💓 Heartbeat - verificando saúde...');
        performOptimizedSync();
      }
    }, 30000); // 30 segundos

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [companyId, performOptimizedSync]);

  // CORREÇÃO: Real-time com debounce reduzido
  useEffect(() => {
    if (!companyId) return;

    console.log('[Stabilized Sync] 📡 Configurando real-time estabilizado');

    const channel = supabase
      .channel(`whatsapp-stabilized-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          if (!isMountedRef.current) return;
          
          console.log('[Stabilized Sync] 📡 Real-time update (estabilizado):', payload.eventType);
          
          // CORREÇÃO: Real-time com menos delay (200ms vs 500ms anterior)
          setTimeout(() => {
            if (isMountedRef.current) {
              performOptimizedSync(true);
            }
          }, 200);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, performOptimizedSync]);

  // Initial fetch
  useEffect(() => {
    if (companyId && isMountedRef.current) {
      performOptimizedSync(true);
    }
  }, [companyId]);

  // FASE 3: Função para forçar healing manual
  const forceOrphanHealing = useCallback(async () => {
    const orphans = state.instances.filter(i => !i.vps_instance_id);
    if (orphans.length > 0) {
      toast.info(`Iniciando cura de ${orphans.length} instâncias órfãs...`);
      await performOrphanHealing(orphans);
      toast.success('Processo de cura concluído!');
    } else {
      toast.success('Nenhuma instância órfã encontrada!');
    }
  }, [state.instances, performOrphanHealing]);

  return {
    ...state,
    refetch: () => performOptimizedSync(true),
    forceOrphanHealing,
    isHealthy: state.healthScore >= 80
  };
};
