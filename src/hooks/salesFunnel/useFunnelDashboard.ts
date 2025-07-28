
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

interface FunnelReport {
  kanban_stage_id: string;
  count: number;
}

export const useFunnelDashboard = (funnelId: string) => {
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['funnel-dashboard', funnelId],
    queryFn: async () => {
      if (!funnelId) return [];

      const { data, error } = await supabase
        .from('leads')
        .select('kanban_stage_id')
        .eq('funnel_id', funnelId);

      if (error) {
        console.error('Error fetching funnel dashboard:', error);
        throw error;
      }

      // Agrupar por estágio
      const groupedData = data.reduce((acc, lead) => {
        const stageId = lead.kanban_stage_id;
        if (stageId) {
          acc[stageId] = (acc[stageId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(groupedData).map(([kanban_stage_id, count]) => ({
        kanban_stage_id,
        count
      }));
    },
    enabled: !!funnelId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  // ✅ CORREÇÃO: Memoizar resultado para evitar re-renders desnecessários
  const memoizedResult = useMemo(() => ({
    report: report || [],
    loading: isLoading,
    error
  }), [report, isLoading, error]);

  return memoizedResult;
};
