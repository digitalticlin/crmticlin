/**
 * 🎯 HOOK PARA BUSCAR ETAPAS WON/LOST
 *
 * RESPONSABILIDADES:
 * ✅ Buscar apenas etapas is_won=true e is_lost=true
 * ✅ Fornecer IDs para os botões de ação dos leads
 * ✅ Não interferir na visualização principal do kanban
 *
 * USO:
 * - SalesFunnelContentUnified usa para calcular wonStageId/lostStageId
 * - LeadCardActions usa os IDs para mostrar botões
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Query keys isoladas para won/lost stages
export const wonLostStagesQueryKeys = {
  all: ['wonlost-stages'] as const,
  byFunnel: (funnelId: string) =>
    [...wonLostStagesQueryKeys.all, 'funnel', funnelId] as const,
};

interface UseWonLostStagesParams {
  funnelId: string | null;
  enabled?: boolean;
}

interface WonLostStage {
  id: string;
  title: string;
  color: string;
  is_won: boolean;
  is_lost: boolean;
  funnel_id: string;
}

export function useWonLostStages({
  funnelId,
  enabled = true
}: UseWonLostStagesParams) {
  const { user } = useAuth();

  const queryResult = useQuery({
    queryKey: wonLostStagesQueryKeys.byFunnel(funnelId || ''),
    queryFn: async (): Promise<WonLostStage[]> => {
      if (!funnelId || !user?.id) {
        return [];
      }

      try {
        console.log('[useWonLostStages] 🔍 Buscando etapas Won/Lost para funil:', funnelId);

        // Buscar APENAS etapas Won/Lost
        const { data: wonLostStages, error } = await supabase
          .from('kanban_stages')
          .select('id, title, color, is_won, is_lost, funnel_id')
          .eq('funnel_id', funnelId)
          .or('is_won.eq.true,is_lost.eq.true'); // Buscar etapas Won OU Lost

        if (error) {
          console.error('[useWonLostStages] ❌ Erro ao buscar etapas Won/Lost:', error);
          throw error;
        }

        console.log('[useWonLostStages] ✅ Etapas Won/Lost encontradas:', {
          total: wonLostStages?.length || 0,
          stages: wonLostStages?.map(s => ({
            id: s.id,
            title: s.title,
            is_won: s.is_won,
            is_lost: s.is_lost
          })) || []
        });

        return wonLostStages || [];
      } catch (error) {
        console.error('[useWonLostStages] ❌ Erro crítico:', error);
        return [];
      }
    },
    enabled: !!funnelId && !!user?.id && enabled,
    staleTime: 60 * 60 * 1000, // 1 hora - etapas Won/Lost não mudam frequentemente
    gcTime: 2 * 60 * 60 * 1000, // 2 horas
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });

  // Derivar dados úteis
  const stages = queryResult.data || [];

  const wonStage = stages.find(s => s.is_won);
  const lostStage = stages.find(s => s.is_lost);

  // Debug apenas quando há mudanças
  console.log('[useWonLostStages] 🎯 Etapas derivadas:', {
    wonStageId: wonStage?.id,
    lostStageId: lostStage?.id,
    wonStageTitle: wonStage?.title,
    lostStageTitle: lostStage?.title
  });

  return {
    // Dados principais
    stages,

    // Etapas específicas
    wonStage,
    lostStage,

    // IDs para uso direto
    wonStageId: wonStage?.id,
    lostStageId: lostStage?.id,

    // Estados
    isLoading: queryResult.isLoading,
    error: queryResult.error,

    // Ações
    refetch: queryResult.refetch
  };
}