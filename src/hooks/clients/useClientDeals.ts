
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Deal {
  id: string;
  lead_id: string;
  status: 'won' | 'lost';
  value: number;
  note?: string;
  date: string;
  created_at: string;
  created_by_user_id: string;
}

export function useClientDeals(leadId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["client-deals", leadId],
    queryFn: async (): Promise<Deal[]> => {
      if (!leadId || !user?.id) return [];
      
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("lead_id", leadId)
        .eq("created_by_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar deals:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!leadId && !!user?.id,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (dealData: Omit<Deal, 'id' | 'created_at' | 'created_by_user_id'>) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from("deals")
        .insert({
          ...dealData,
          created_by_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client-deals", data.lead_id] });
    },
  });
}
