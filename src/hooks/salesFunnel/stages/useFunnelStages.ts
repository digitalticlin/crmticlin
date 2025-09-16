/**
 * 🎯 HOOK ISOLADO - BUSCAR STAGES/ETAPAS DO FUNIL
 *
 * RESPONSABILIDADES:
 * ✅ Buscar etapas de um funil específico
 * ✅ Cache otimizado com React Query
 * ✅ Ordenação por order_position
 * ✅ Identificar etapas especiais (ganho/perdido)
 *
 * NÃO FAZ:
 * ❌ CRUD de etapas (isso seria em useStageActions)
 * ❌ Real-time (isso seria em useStagesRealtime)
 * ❌ Gerenciar leads (isso é no useFunnelLeads)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { KanbanStage } from '@/types/funnel';

// Query keys isoladas para stages
export const funnelStagesQueryKeys = {
  all: ['salesfunnel-stages'] as const,
  byFunnel: (funnelId: string) =>
    [...funnelStagesQueryKeys.all, 'funnel', funnelId] as const,
  won: (funnelId: string) =>
    [...funnelStagesQueryKeys.all, 'won', funnelId] as const,
  lost: (funnelId: string) =>
    [...funnelStagesQueryKeys.all, 'lost', funnelId] as const,
};

interface UseFunnelStagesParams {
  funnelId: string | null;
  enabled?: boolean;
}

export function useFunnelStages({
  funnelId,
  enabled = true
}: UseFunnelStagesParams) {
  const { user } = useAuth();

  const queryResult = useQuery({
    queryKey: funnelStagesQueryKeys.byFunnel(funnelId || ''),
    queryFn: async () => {
      if (!funnelId || !user?.id) {
        console.log('[useFunnelStages] ❌ Sem funil ou usuário');
        return [];
      }

      console.log('[useFunnelStages] 🔍 Buscando etapas para funil:', funnelId);

      try {
        // Buscar via funil para contornar possíveis problemas de RLS
        const { data: funnelWithStages, error: funnelError } = await supabase
          .from('funnels')
          .select(`
            id,
            name,
            kanban_stages (
              id,
              title,
              color,
              order_position,
              is_fixed,
              is_won,
              is_lost,
              funnel_id,
              created_by_user_id,
              ai_enabled
            )
          `)
          .eq('id', funnelId)
          .single();

        if (funnelError) {
          console.error('[useFunnelStages] ❌ Erro ao buscar via funil:', funnelError);

          // Fallback: tentar buscar direto
          const { data: directStages, error: directError } = await supabase
            .from('kanban_stages')
            .select('*')
            .eq('funnel_id', funnelId)
            .order('order_position', { ascending: true });

          if (directError) {
            console.error('[useFunnelStages] ❌ Erro no fallback direto:', directError);
            throw directError;
          }

          console.log('[useFunnelStages] ✅ Etapas via fallback:', directStages?.length || 0);
          return directStages || [];
        }

        const stages = funnelWithStages?.kanban_stages || [];

        // Ordenar por order_position
        const sortedStages = stages.sort((a, b) =>
          (a.order_position || 0) - (b.order_position || 0)
        );

        console.log('[useFunnelStages] ✅ Etapas encontradas:', {
          total: sortedStages.length,
          etapas: sortedStages.map(s => ({
            id: s.id,
            title: s.title,
            order: s.order_position,
            is_won: s.is_won,
            is_lost: s.is_lost
          }))
        });

        return sortedStages;
      } catch (error) {
        console.error('[useFunnelStages] ❌ Erro crítico:', error);
        return [];
      }
    },
    enabled: !!funnelId && !!user?.id && enabled,
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000, // 60 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });

  // Derivar dados úteis das etapas
  const stages = queryResult.data || [];

  // Identificar etapas especiais
  const wonStage = stages.find(s => s.is_won);
  const lostStage = stages.find(s => s.is_lost);
  const firstStage = stages.find(s => !s.is_won && !s.is_lost);

  // Etapas principais (não ganho nem perdido)
  const mainStages = stages.filter(s => !s.is_won && !s.is_lost);

  console.log('[useFunnelStages] 📊 Etapas processadas:', {
    total: stages.length,
    main: mainStages.length,
    wonStageId: wonStage?.id,
    lostStageId: lostStage?.id,
    firstStageId: firstStage?.id
  });

  return {
    // Dados
    stages,
    mainStages,

    // Etapas especiais
    wonStage,
    lostStage,
    firstStage,
    wonStageId: wonStage?.id,
    lostStageId: lostStage?.id,
    firstStageId: firstStage?.id,

    // Estados
    isLoading: queryResult.isLoading,
    error: queryResult.error,

    // Ações
    refetch: queryResult.refetch
  };
}