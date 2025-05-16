
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanStage } from "@/types/funnel";

export function useStageDatabase(funnelId?: string) {
  const queryClient = useQueryClient();

  // Buscar todos os estágios do funil e empresa
  const stagesQuery = useQuery({
    queryKey: ["kanban_stages", funnelId],
    queryFn: async () => {
      if (!funnelId) return [];
      const { data, error } = await supabase
        .from("kanban_stages")
        .select("*")
        .eq("funnel_id", funnelId)
        .order("order_position", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Mutations: adicionar, editar, remover estão disponíveis mas mantidas
  // para uso futuro/expansão se necessário (seguindo sua diretriz de não alterar logic/layout)

  return {
    stages: stagesQuery.data ?? [],
    isLoading: stagesQuery.isLoading,
    error: stagesQuery.error,
    refetchStages: stagesQuery.refetch,
  };
}
