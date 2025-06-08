
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
 * Hook de Sync Estabilizado - CORRIGIDO para usar created_by_user_id
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

  const { userId } = useCompanyData();
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // **CORREÇÃO**: Sync baseado em created_by_user_id (não company_id)
  const performOptimizedSync = useCallback(async (forceRefresh = false): Promise<any[]> => {
    if (!userId || !isMountedRef.current) {
      return [];
    }

    const now = Date.now();
    const timeSinceLast = now - lastFetchRef.current;
    
    // Debounce reduzido para 200ms
    if (!forceRefresh && timeSinceLast < 200) {
      console.log('[Stabilized Sync] ⏸️ Debounce ativo');
      return state.instances;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      lastFetchRef.current = now;

      console.log('[Stabilized Sync] 🔄 Executando sync para usuário:', userId);

      // **CORREÇÃO**: Buscar por created_by_user_id
      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('created_by_user_id', userId)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (!isMountedRef.current) return [];

      if (fetchError) {
        throw fetchError;
      }

      const instances = data || [];
      console.log(`[Stabilized Sync] ✅ ${instances.length} instâncias do usuário carregadas`);
      
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

        // Log de instâncias prontas para mostrar
        const readyInstances = instances.filter(i => ['open', 'ready'].includes(i.connection_status));
        if (readyInstances.length > 0) {
          console.log(`[Stabilized Sync] 🎯 ${readyInstances.length} instâncias PRONTAS para exibir`);
          readyInstances.forEach(instance => {
            console.log(`[Stabilized Sync] - ${instance.instance_name}: ${instance.connection_status} | Phone: ${instance.phone} | Profile: ${instance.profile_name}`);
          });
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

  // **CORREÇÃO**: Real-time baseado em created_by_user_id
  useEffect(() => {
    if (!userId) return;

    console.log('[Stabilized Sync] 📡 Configurando real-time para usuário:', userId);

    const channel = supabase
      .channel(`whatsapp-stabilized-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `created_by_user_id=eq.${userId}`
        },
        (payload) => {
          if (!isMountedRef.current) return;
          
          console.log('[Stabilized Sync] 📡 Real-time update:', payload.eventType);
          
          // Update imediato após mudança
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

  // **CORREÇÃO**: Healing global que verifica órfãs created_by_user_id: NULL
  const forceOrphanHealing = useCallback(async () => {
    try {
      console.log('[Stabilized Sync] 🔍 Verificando órfãs globais (created_by_user_id: NULL)...');
      
      const { data: globalOrphans } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .is('created_by_user_id', null)
        .eq('connection_type', 'web');

      if (globalOrphans && globalOrphans.length > 0) {
        toast.info(`${globalOrphans.length} instâncias órfãs globais detectadas (created_by_user_id: NULL)`);
        console.log('[Stabilized Sync] 🏠 Órfãs globais encontradas:', globalOrphans.map(o => ({
          name: o.instance_name,
          phone: o.phone,
          status: o.connection_status
        })));
      } else {
        toast.success('Nenhuma instância órfã global encontrada!');
      }
    } catch (error) {
      console.error('[Stabilized Sync] ❌ Erro ao verificar órfãs globais:', error);
      toast.error('Erro ao verificar órfãs globais');
    }
  }, []);

  return {
    ...state,
    refetch: () => performOptimizedSync(true),
    forceOrphanHealing,
    isHealthy: state.healthScore >= 80
  };
};
