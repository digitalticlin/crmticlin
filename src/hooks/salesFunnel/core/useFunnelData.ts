/**
 * 🎯 HOOK BASE - SINGLE QUERY ARCHITECTURE
 *
 * Este é o ÚNICO hook que faz query HTTP ao banco.
 * Todos os outros hooks derivam dados deste cache compartilhado.
 *
 * ARQUITETURA:
 * ✅ 1 única query com JOINs
 * ✅ Cache compartilhado via React Query
 * ✅ Deduplicação automática de requisições
 * ✅ Fonte única da verdade
 *
 * RESPONSABILIDADES:
 * ✅ Buscar funil completo (stages + leads iniciais)
 * ✅ Manter cache atualizado
 * ✅ Gerenciar realtime (apenas invalidação)
 *
 * NÃO FAZ:
 * ❌ Mutações (criar/editar/deletar)
 * ❌ Lógica de negócio
 * ❌ Manipular estado local
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

// ✅ QUERY KEY ÚNICA - Fonte da verdade
export const funnelDataQueryKeys = {
  all: ['funnel-data'] as const,
  byId: (funnelId: string) => [...funnelDataQueryKeys.all, funnelId] as const,
};

interface UseFunnelDataOptions {
  funnelId: string | null;
  enabled?: boolean;
  realtime?: boolean;
}

/**
 * Hook base que executa a query única do funil
 * Todos os outros hooks devem usar esta mesma queryKey para compartilhar cache
 */
export function useFunnelData({ funnelId, enabled = true, realtime = true }: UseFunnelDataOptions) {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();
  const realtimeSubscription = useRef<any>(null);

  // 🚀 QUERY ÚNICA - Busca tudo de uma vez
  const query = useQuery({
    queryKey: funnelDataQueryKeys.byId(funnelId || ''),
    queryFn: async () => {
      if (!funnelId || !user?.id) {
        return null;
      }

      // 🔒 Determinar owner dos leads baseado no role
      let leadsOwnerId = user.id;

      if (role === 'operational') {
        // Buscar admin do operational
        const { data: profile } = await supabase
          .from('profiles')
          .select('created_by_user_id')
          .eq('id', user.id)
          .single();

        leadsOwnerId = profile?.created_by_user_id || user.id;
      }

      console.log('[useFunnelData] 🎯 Executando query única:', {
        funnelId,
        role,
        userId: user.id,
        leadsOwnerId
      });

      // ✅ QUERY ÚNICA COM JOINS - Busca tudo de uma vez
      const { data: funnelData, error } = await supabase
        .from('funnels')
        .select(`
          id,
          name,
          created_by_user_id,
          kanban_stages (
            id,
            title,
            color,
            order_position,
            is_fixed,
            is_won,
            is_lost,
            ai_enabled,
            funnel_id,
            created_by_user_id,
            created_at,
            updated_at
          )
        `)
        .eq('id', funnelId)
        .single();

      if (error) {
        console.error('[useFunnelData] ❌ Erro ao buscar funil:', error);
        throw error;
      }

      // Buscar leads iniciais de cada stage (20 por etapa)
      const stages = funnelData.kanban_stages || [];
      const leadsPromises = stages
        .filter((stage: any) => !stage.is_won && !stage.is_lost) // Apenas stages principais
        .map(async (stage: any) => {
          const { data: stageLeads } = await supabase
            .from('leads')
            .select(`
              *,
              lead_tags (
                tag_id,
                tags (
                  id,
                  name,
                  color
                )
              )
            `)
            .eq('funnel_id', funnelId)
            .eq('created_by_user_id', leadsOwnerId)
            .eq('kanban_stage_id', stage.id)
            .order('created_at', { ascending: false })
            .limit(20);

          return { stageId: stage.id, leads: stageLeads || [] };
        });

      const leadsResults = await Promise.all(leadsPromises);

      // Mapear leads por stage
      const leadsByStage = leadsResults.reduce((acc, result) => {
        acc[result.stageId] = result.leads;
        return acc;
      }, {} as Record<string, any[]>);

      console.log('[useFunnelData] ✅ Query única executada:', {
        stages: stages.length,
        totalLeads: Object.values(leadsByStage).flat().length
      });

      return {
        funnel: {
          id: funnelData.id,
          name: funnelData.name,
          created_by_user_id: funnelData.created_by_user_id
        },
        stages: stages.sort((a: any, b: any) => (a.order_position || 0) - (b.order_position || 0)),
        leadsByStage,
        leadsOwnerId // Incluir para uso posterior
      };
    },
    enabled: enabled && !!funnelId && !!user?.id && !roleLoading,
    staleTime: 0, // Sempre considerar stale para permitir invalidação
    gcTime: 10 * 60 * 1000, // 10 minutos em cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });

  // 🔴 REALTIME - Apenas invalida cache, NÃO manipula estado
  useEffect(() => {
    if (!realtime || !funnelId || !enabled || !user?.id) return;

    console.log('[useFunnelData] 🔴 Configurando realtime (invalidação de cache):', funnelId);

    const channel = supabase.channel(`funnel-data-${funnelId}`);

    // Listener para leads
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'leads',
      filter: `funnel_id=eq.${funnelId}`
    }, (payload) => {
      console.log('[useFunnelData] 📡 Realtime leads - INVALIDANDO cache:', payload.eventType);

      // ✅ Apenas invalida cache - React Query refaz query automaticamente
      queryClient.invalidateQueries({
        queryKey: funnelDataQueryKeys.byId(funnelId)
      });
    });

    // Listener para stages
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'kanban_stages',
      filter: `funnel_id=eq.${funnelId}`
    }, (payload) => {
      console.log('[useFunnelData] 📡 Realtime stages - INVALIDANDO cache:', payload.eventType);

      // ✅ Apenas invalida cache - React Query refaz query automaticamente
      queryClient.invalidateQueries({
        queryKey: funnelDataQueryKeys.byId(funnelId)
      });
    });

    channel.subscribe();
    realtimeSubscription.current = channel;

    return () => {
      console.log('[useFunnelData] 🔴 Desconectando realtime');
      if (realtimeSubscription.current) {
        realtimeSubscription.current.unsubscribe();
      }
    };
  }, [realtime, funnelId, enabled, user?.id, queryClient]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
}
