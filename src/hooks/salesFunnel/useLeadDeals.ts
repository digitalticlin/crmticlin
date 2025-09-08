
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { salesFunnelQueryKeys } from "./queryKeys";

export interface Deal {
  id: string;
  status: "won" | "lost";
  value: number;
  date: string;
  note?: string;
}

export const useLeadDeals = (leadId?: string) => {
  return useQuery({
    queryKey: salesFunnelQueryKeys.deals(leadId || ''),
    queryFn: async (): Promise<Deal[]> => {
      if (!leadId) return [];

      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("lead_id", leadId)
        .order("date", { ascending: false });

      if (error) throw error;

      return data.map(deal => ({
        id: deal.id,
        status: deal.status as "won" | "lost",
        value: Number(deal.value || 0),
        date: new Date(deal.date).toLocaleDateString('pt-BR'),
        note: deal.note || undefined
      }));
    },
    enabled: !!leadId
  });
};
