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
import { useUserRole } from '@/hooks/useUserRole';

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
  const { role, loading: roleLoading } = useUserRole();

  const queryResult = useQuery({
    queryKey: stageLeadCountQueryKeys.byFunnel(funnelId || '', user?.id || ''),
    queryFn: async () => {
      if (!funnelId || !user?.id) {
        console.log('[useStageLeadCount] ❌ Sem funil ou usuário');
        return {};
      }

      console.log('[useStageLeadCount] 🔢 Buscando contagem de leads por etapa');

      try {
        // 🚀 BUSCAR LEADS OWNER ID (mesma lógica do useFunnelDataManager)
        let leadsOwnerId: string = user.id; // Default: admin

        if (role === 'operational') {
          // Buscar quem é o admin do operational
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('created_by_user_id')
            .eq('id', user.id)
            .single();

          if (!profileError && profile?.created_by_user_id) {
            leadsOwnerId = profile.created_by_user_id;
          }
        }

        // Query otimizada para contar leads por etapa - USANDO MESMO FILTRO que useFunnelDataManager
        const { data, error } = await supabase
          .from('leads')
          .select('kanban_stage_id')
          .eq('funnel_id', funnelId)
          .eq('created_by_user_id', leadsOwnerId); // 🔒 USAR MESMO FILTRO
          // ✅ REMOVIDO: .in('conversation_status', ['active', 'closed', null])
          // Para contar 100% dos leads independente do status

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

        console.log('[useStageLeadCount] ✅ Contagem por etapa:', {
          leadsOwnerId,
          role,
          countByStage
        });

        return countByStage;
      } catch (error) {
        console.error('[useStageLeadCount] ❌ Erro crítico:', error);
        return {};
      }
    },
    enabled: !!funnelId && !!user?.id && !roleLoading && enabled,
    staleTime: 60 * 1000, // 1 minuto - atualiza mais frequentemente que dados dos leads
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1 // Tentar apenas 1 vez em caso de erro
  });

  // Função para obter contagem de uma etapa específica
  const getStageCount = (stageId: string): number => {
    return queryResult.data?.[stageId] || 0;
  };

  return {
    countByStage: queryResult.data || {},
    getStageCount,
    isLoading: queryResult.isLoading || roleLoading,
    error: queryResult.error,
    refetch: queryResult.refetch
  };
}