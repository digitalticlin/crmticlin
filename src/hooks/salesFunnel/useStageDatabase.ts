
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanStage } from "@/types/funnel";

export function useStageDatabase(funnelId?: string) {
  const queryClient = useQueryClient();

  // Buscar estágios criados pelo usuário atual
  const stagesQuery = useQuery({
    queryKey: ["kanban_stages", funnelId],
    queryFn: async () => {
      if (!funnelId) return [];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("kanban_stages")
        .select("*")
        .eq("funnel_id", funnelId)
        .eq("created_by_user_id", user.id) // Só estágios do usuário atual
        .order("order_position", { ascending: true });
        
      if (error) throw error;
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
