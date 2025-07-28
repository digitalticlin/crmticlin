
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

interface Stage {
  id: string;
  title: string;
  color: string;
  order_position: number;
  is_won: boolean;
  is_lost: boolean;
}

export const useStageDatabase = (funnelId: string | undefined) => {
  const { data: stages, isLoading, error } = useQuery({
    queryKey: ['stages', funnelId],
    queryFn: async () => {
      if (!funnelId) return [];

      const { data, error } = await supabase
        .from('kanban_stages')
        .select('*')
        .eq('funnel_id', funnelId)
        .order('order_position');

      if (error) {
        console.error('Error fetching stages:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!funnelId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  // ✅ CORREÇÃO: Memoizar resultado para evitar re-renders desnecessários
  const memoizedResult = useMemo(() => ({
    stages: stages || [],
    loading: isLoading,
    error
  }), [stages, isLoading, error]);

  return memoizedResult;
};
