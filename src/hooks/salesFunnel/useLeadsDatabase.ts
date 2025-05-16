
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanLead, KanbanTag } from "@/types/kanban";

/** Busca os leads do funil, já filtrados conforme RLS */
export function useLeadsDatabase(funnelId?: string) {
  const queryClient = useQueryClient();

  const leadsQuery = useQuery({
    queryKey: ["leads", funnelId],
    queryFn: async () => {
      if (!funnelId) return [];
      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          lead_tags (
            tag_id,
            tags: tag_id (id, name, color)
          )
        `)
        .eq("funnel_id", funnelId);

      // Mapeia para estructura esperada
      return (
        data?.map((lead) => ({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          lastMessage: lead.last_message,
          lastMessageTime: lead.last_message_time || "",
          tags:
            (lead.lead_tags || []).map((lt: any) =>
              lt.tags
                ? {
                    id: lt.tags.id,
                    name: lt.tags.name,
                    color: lt.tags.color,
                  }
                : null
            ).filter(Boolean),
          notes: lead.notes,
          columnId: lead.kanban_stage_id,
          purchaseValue: lead.purchase_value,
          assignedUser: lead.owner_id,
        })) ?? []
      );
    },
  });

  // Atualização dos dados do lead
  const updateLeadMutation = useMutation({
    mutationFn: async ({
      leadId,
      fields,
    }: {
      leadId: string;
      fields: Partial<KanbanLead>;
    }) => {
      const { name, notes, purchaseValue, assignedUser } = fields;
      const { error } = await supabase.from("leads").update({
        name,
        notes,
        purchase_value: purchaseValue,
        owner_id: assignedUser,
      }).eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", funnelId] });
    },
  });

  // Gerenciar tags do lead (associação via lead_tags)
  const addTagMutation = useMutation({
    mutationFn: async ({
      leadId,
      tagId,
    }: {
      leadId: string;
      tagId: string;
    }) => {
      // Adiciona em lead_tags
      const { error } = await supabase
        .from("lead_tags")
        .insert({ lead_id: leadId, tag_id: tagId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", funnelId] });
    },
  });
  const removeTagMutation = useMutation({
    mutationFn: async ({
      leadId,
      tagId,
    }: {
      leadId: string;
      tagId: string;
    }) => {
      // Remove de lead_tags
      const { error } = await supabase
        .from("lead_tags")
        .delete()
        .eq("lead_id", leadId)
        .eq("tag_id", tagId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", funnelId] });
    },
  });

  return {
    leads: leadsQuery.data ?? [],
    isLoading: leadsQuery.isLoading,
    error: leadsQuery.error,
    updateLead: updateLeadMutation.mutateAsync,
    addTagToLead: addTagMutation.mutateAsync,
    removeTagFromLead: removeTagMutation.mutateAsync,
    refetchLeads: leadsQuery.refetch,
  };
}
