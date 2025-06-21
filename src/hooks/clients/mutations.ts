
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData } from "./types";
import { toast } from "sonner";

export function useCreateClientMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      // First, get a default WhatsApp instance for the user
      const { data: whatsappInstance, error: whatsappError } = await supabase
        .from("whatsapp_instances")
        .select("id")
        .eq("created_by_user_id", userId)
        .eq("connection_status", "connected")
        .limit(1)
        .maybeSingle();

      if (whatsappError) {
        console.error("Erro ao buscar instância do WhatsApp:", whatsappError);
      }

      // If no connected instance, try to get any instance
      let whatsappNumberId = whatsappInstance?.id;
      if (!whatsappNumberId) {
        const { data: anyInstance } = await supabase
          .from("whatsapp_instances")
          .select("id")
          .eq("created_by_user_id", userId)
          .limit(1)
          .maybeSingle();
        
        whatsappNumberId = anyInstance?.id;
      }

      if (!whatsappNumberId) {
        throw new Error("Nenhuma instância do WhatsApp encontrada para este usuário");
      }

      // Get the default funnel for this user
      const { data: defaultFunnel } = await supabase
        .from("funnels")
        .select("id")
        .eq("created_by_user_id", userId)
        .limit(1)
        .maybeSingle();

      if (!defaultFunnel) {
        throw new Error("Nenhum funil encontrado para este usuário");
      }

      // Prepare lead data without contacts (we'll store them in the main fields)
      const { contacts, ...leadData } = data;
      
      // Get the next order_position for the default stage
      const { data: defaultStage } = await supabase
        .from("kanban_stages")
        .select("id")
        .eq("funnel_id", defaultFunnel.id)
        .order("order_position")
        .limit(1)
        .maybeSingle();

      let nextOrderPosition = 0;
      if (defaultStage) {
        const { data: maxPositionData } = await supabase
          .from("leads")
          .select("order_position")
          .eq("kanban_stage_id", defaultStage.id)
          .order("order_position", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        nextOrderPosition = (maxPositionData?.order_position || 0) + 1;
      }
      
      const { data: insertData, error } = await supabase
        .from("leads")
        .insert({
          ...leadData,
          created_by_user_id: userId,
          whatsapp_number_id: whatsappNumberId,
          funnel_id: defaultFunnel.id,
          kanban_stage_id: defaultStage?.id,
          order_position: nextOrderPosition,
        })
        .select()
        .single();

      if (error) throw error;

      return insertData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", userId] });
      toast.success("Cliente criado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar cliente:", error);
      toast.error("Erro ao criar cliente");
    },
  });
}

export function useUpdateClientMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      const { data: updateData, error } = await supabase
        .from("leads")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updateData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", userId] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar cliente:", error);
      toast.error("Erro ao atualizar cliente");
    },
  });
}

export function useDeleteClientMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", userId] });
      toast.success("Cliente removido com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao remover cliente:", error);
      toast.error("Erro ao remover cliente");
    },
  });
}
