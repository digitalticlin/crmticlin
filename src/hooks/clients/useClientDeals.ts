
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientDeal {
  id: string;
  status: "won" | "lost";
  value: number;
  date: string;
  note?: string;
  created_at: string;
}

export const useClientDeals = (clientId: string) => {
  return useQuery({
    queryKey: ["client-deals", clientId],
    queryFn: async (): Promise<ClientDeal[]> => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("lead_id", clientId)
        .order("date", { ascending: false });

      if (error) throw error;

      return (data || []).map(deal => ({
        id: deal.id,
        status: deal.status as "won" | "lost",
        value: Number(deal.value || 0),
        date: deal.date,
        note: deal.note || undefined,
        created_at: deal.created_at
      }));
    },
    enabled: !!clientId,
  });
};

export const useCreateDeal = (clientId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dealData: { status: "won" | "lost"; value: number; note?: string }) => {
      const { data, error } = await supabase
        .from("deals")
        .insert({
          lead_id: clientId,
          status: dealData.status,
          value: dealData.value,
          note: dealData.note,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-deals", clientId] });
    },
  });
};

export const useDeleteDeal = (clientId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase
        .from("deals")
        .delete()
        .eq("id", dealId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-deals", clientId] });
    },
  });
};
