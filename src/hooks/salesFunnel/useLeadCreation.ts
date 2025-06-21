
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CreateLeadData {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  purchase_value?: number;
  funnelId: string;
  stageId: string;
  tags?: string[];
}

export function useLeadCreation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (leadData: CreateLeadData) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      // Get WhatsApp instance
      const { data: whatsappInstance } = await supabase
        .from("whatsapp_instances")
        .select("id")
        .eq("created_by_user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!whatsappInstance) {
        throw new Error("Nenhuma instância do WhatsApp encontrada");
      }

      // Get next order position
      const { data: maxPositionData } = await supabase
        .from("leads")
        .select("order_position")
        .eq("kanban_stage_id", leadData.stageId)
        .order("order_position", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrderPosition = (maxPositionData?.order_position || 0) + 1;

      // Create lead
      const { data: newLead, error } = await supabase
        .from("leads")
        .insert({
          name: leadData.name,
          phone: leadData.phone,
          email: leadData.email,
          notes: leadData.notes,
          purchase_value: leadData.purchase_value || 0,
          funnel_id: leadData.funnelId,
          kanban_stage_id: leadData.stageId,
          whatsapp_number_id: whatsappInstance.id,
          order_position: nextOrderPosition,
          created_by_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add tags if provided
      if (leadData.tags && leadData.tags.length > 0) {
        const tagInserts = leadData.tags.map(tagId => ({
          lead_id: newLead.id,
          tag_id: tagId,
          created_by_user_id: user.id,
        }));

        const { error: tagsError } = await supabase
          .from("lead_tags")
          .insert(tagInserts);

        if (tagsError) {
          console.error("Erro ao adicionar tags:", tagsError);
        }
      }

      return newLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
      toast.success("Lead criado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar lead:", error);
      toast.error("Erro ao criar lead");
    },
  });
}
