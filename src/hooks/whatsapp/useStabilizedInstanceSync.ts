
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
 * Hook de Sync Estabilizado sem loops infinitos - MIGRADO PARA USER_ID
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

  const { userId } = useCompanyData(); // CORREÇÃO: Usar userId ao invés de companyId
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // CORREÇÃO: Sync simples baseado em created_by_user_id
  const performOptimizedSync = useCallback(async (forceRefresh = false): Promise<any[]> => {
    if (!userId || !isMountedRef.current) {
      return [];
    }

    const now = Date.now();
    const timeSinceLast = now - lastFetchRef.current;
    
    // CORREÇÃO: Debounce reduzido para 200ms
    if (!forceRefresh && timeSinceLast < 200) {
      console.log('[Stabilized Sync] ⏸️ Debounce ativo');
      return state.instances;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      lastFetchRef.current = now;

      console.log('[Stabilized Sync] 🔄 Executando sync para usuário:', userId);

      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('created_by_user_id', userId) // CORREÇÃO: Usar created_by_user_id
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (!isMountedRef.current) return [];

      if (fetchError) {
        throw fetchError;
      }

      const instances = data || [];
      console.log(`[Stabilized Sync] ✅ ${instances.length} instâncias carregadas`);
      
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

        // Sistema de healing para órfãs (opcional)
        if (orphanInstances.length > 0) {
          console.warn(`[Stabilized Sync] 🚨 ${orphanInstances.length} instâncias órfãs detectadas`);
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
      }
      return [];
    }
  }, [userId, state.instances]);

  // CORREÇÃO: Real-time simples baseado em created_by_user_id
  useEffect(() => {
    if (!userId) return;

    console.log('[Stabilized Sync] 📡 Configurando real-time para usuário');

    const channel = supabase
      .channel(`whatsapp-stabilized-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `created_by_user_id=eq.${userId}` // CORREÇÃO: Filtrar por created_by_user_id
        },
        (payload) => {
          if (!isMountedRef.current) return;
          
          console.log('[Stabilized Sync] 📡 Real-time update:', payload.eventType);
          
          // CORREÇÃO: Update imediato
          performOptimizedSync(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, performOptimizedSync]);

  // Initial fetch
  useEffect(() => {
    if (userId && isMountedRef.current) {
      performOptimizedSync(true);
    }
  }, [userId]);

  // CORREÇÃO: Função para forçar healing manual simples
  const forceOrphanHealing = useCallback(async () => {
    const orphans = state.instances.filter(i => !i.vps_instance_id);
    if (orphans.length > 0) {
      toast.info(`${orphans.length} instâncias órfãs detectadas`);
    } else {
      toast.success('Nenhuma instância órfã encontrada!');
    }
  }, [state.instances]);

  return {
    ...state,
    refetch: () => performOptimizedSync(true),
    forceOrphanHealing,
    isHealthy: state.healthScore >= 80
  };
};
