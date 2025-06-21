
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useLeadsDatabase(funnelId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: leads = [], refetch: refetchLeads } = useQuery({
    queryKey: ["kanban-leads", funnelId],
    queryFn: async () => {
      if (!funnelId || !user?.id) return [];

      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          tags:lead_tags(
            tag:tags(*)
          )
        `)
        .eq("funnel_id", funnelId)
        .eq("created_by_user_id", user.id)
        .order("order_position");

      if (error) throw error;
      return data || [];
    },
    enabled: !!funnelId && !!user?.id,
  });

  const addTagToLead = useMutation({
    mutationFn: async ({ leadId, tagId }: { leadId: string; tagId: string }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const { error } = await supabase
        .from("lead_tags")
        .insert({
          lead_id: leadId,
          tag_id: tagId,
          created_by_user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
      toast.success("Tag adicionada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao adicionar tag:", error);
      toast.error("Erro ao adicionar tag");
    },
  });

  const removeTagFromLead = useMutation({
    mutationFn: async ({ leadId, tagId }: { leadId: string; tagId: string }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const { error } = await supabase
        .from("lead_tags")
        .delete()
        .eq("lead_id", leadId)
        .eq("tag_id", tagId)
        .eq("created_by_user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
      toast.success("Tag removida com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao remover tag:", error);
      toast.error("Erro ao remover tag");
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ leadId, fields }: { leadId: string; fields: Record<string, any> }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const { error } = await supabase
        .from("leads")
        .update(fields)
        .eq("id", leadId)
        .eq("created_by_user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar lead:", error);
      toast.error("Erro ao atualizar lead");
    },
  });

  return {
    leads,
    refetchLeads,
    addTagToLead,
    removeTagFromLead,
    updateLead
  };
}
