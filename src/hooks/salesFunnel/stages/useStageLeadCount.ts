/**
 * 🎯 HOOK ISOLADO - CONTAR LEADS POR ETAPA
 *
 * RESPONSABILIDADES:
 * ✅ Buscar total de leads de cada etapa no banco
 * ✅ Cache otimizado por etapa
 * ✅ Atualização em tempo real
 *
 * NÃO FAZ:
 * ❌ Buscar dados dos leads (isso é no useFunnelLeads)
 * ❌ Real-time de dados (isso é no useLeadsRealtime)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Query keys isoladas para contagem
export const stageLeadCountQueryKeys = {
  all: ['stage-lead-count'] as const,
  byFunnel: (funnelId: string, userId: string) =>
    [...stageLeadCountQueryKeys.all, 'funnel', funnelId, 'user', userId] as const,
  byStage: (stageId: string, userId: string) =>
    [...stageLeadCountQueryKeys.all, 'stage', stageId, 'user', userId] as const,
};

interface UseStageLeadCountParams {
  funnelId: string | null;
  enabled?: boolean;
}

export function useStageLeadCount({
  funnelId,
  enabled = true
}: UseStageLeadCountParams) {
  const { user } = useAuth();

  const queryResult = useQuery({
    queryKey: stageLeadCountQueryKeys.byFunnel(funnelId || '', user?.id || ''),
    queryFn: async () => {
      if (!funnelId || !user?.id) {
        console.log('[useStageLeadCount] ❌ Sem funil ou usuário');
        return {};
      }

      console.log('[useStageLeadCount] 🔢 Buscando contagem de leads por etapa');

      try {
        // Query otimizada para contar leads por etapa
        const { data, error } = await supabase
          .from('leads')
          .select('kanban_stage_id')
          .eq('funnel_id', funnelId)
          .eq('created_by_user_id', user.id)
          .not('state', 'in', '("won","lost")') // Excluir leads ganhos e perdidos do funil principal
          .in('conversation_status', ['active', 'closed', null]);

        if (error) {
          console.error('[useStageLeadCount] ❌ Erro ao contar leads:', error);
          throw error;
        }

        // Agrupar contagem por etapa
        const countByStage: Record<string, number> = {};
        data?.forEach(lead => {
          const stageId = lead.kanban_stage_id || 'sem-etapa';
          countByStage[stageId] = (countByStage[stageId] || 0) + 1;
        });

        console.log('[useStageLeadCount] ✅ Contagem por etapa:', countByStage);

        return countByStage;
      } catch (error) {
        console.error('[useStageLeadCount] ❌ Erro crítico:', error);
        return {};
      }
    },
    enabled: !!funnelId && !!user?.id && enabled,
    staleTime: 60 * 1000, // 1 minuto - atualiza mais frequentemente que dados dos leads
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });

  // Função para obter contagem de uma etapa específica
  const getStageCount = (stageId: string): number => {
    return queryResult.data?.[stageId] || 0;
  };

  return {
    countByStage: queryResult.data || {},
    getStageCount,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    refetch: queryResult.refetch
  };
}