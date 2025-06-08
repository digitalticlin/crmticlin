
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanStage } from "@/types/funnel";

export function useStageDatabase(funnelId?: string) {
  const queryClient = useQueryClient();

  // Buscar TODOS os estágios do usuário
  const stagesQuery = useQuery({
    queryKey: ["kanban_stages", funnelId],
    queryFn: async () => {
      if (!funnelId) return [];
      
      console.log('[useStageDatabase] 🔓 ACESSO POR USUÁRIO - buscando estágios do funil');
      
      // Buscar estágios criados pelo usuário
      const { data, error } = await supabase
        .from("kanban_stages")
        .select("*")
        .eq("funnel_id", funnelId)
        .order("order_position", { ascending: true });
        
      if (error) throw error;
      
      console.log('[useStageDatabase] ✅ Estágios encontrados (ACESSO POR USUÁRIO):', data?.length || 0);
      return data ?? [];
    },
  });

  return {
    stages: stagesQuery.data ?? [],
    isLoading: stagesQuery.isLoading,
    error: stagesQuery.error,
    refetchStages: stagesQuery.refetch,
  };
}
