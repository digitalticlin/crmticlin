
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanStage } from "@/types/funnel";

export function useStageDatabase(funnelId?: string) {
  const queryClient = useQueryClient();

  // Buscar TODOS os estágios do usuário
  const stagesQuery = useQuery({
    queryKey: ["kanban_stages", funnelId],
    queryFn: async () => {
      if (!funnelId) {
        console.log('[useStageDatabase] ⚠️ Nenhum funnelId fornecido');
        return [];
      }
      
      console.log('[useStageDatabase] 🔍 Buscando estágios do funil:', funnelId);
      
      // Buscar estágios do funil específico
      const { data, error } = await supabase
        .from("kanban_stages")
        .select("*")
        .eq("funnel_id", funnelId)
        .order("order_position", { ascending: true });
        
      if (error) {
        console.error('[useStageDatabase] ❌ Erro ao buscar estágios:', error);
        throw error;
      }
      
      console.log('[useStageDatabase] ✅ Estágios encontrados:', {
        count: data?.length || 0,
        stages: data?.map(s => ({ id: s.id, title: s.title, order: s.order_position }))
      });
      
      return data ?? [];
    },
    enabled: !!funnelId,
  });

  return {
    stages: stagesQuery.data ?? [],
    isLoading: stagesQuery.isLoading,
    error: stagesQuery.error,
    refetchStages: stagesQuery.refetch,
  };
}
