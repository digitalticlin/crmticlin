
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData, LeadContact } from "./types";
import { toast } from "sonner";

export function useCreateClientMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      // First, get a default WhatsApp instance for the company
      const { data: whatsappInstance, error: whatsappError } = await supabase
        .from("whatsapp_instances")
        .select("id")
        .eq("company_id", companyId)
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
          .eq("company_id", companyId)
          .limit(1)
          .maybeSingle();
        
        whatsappNumberId = anyInstance?.id;
      }

      if (!whatsappNumberId) {
        throw new Error("Nenhuma instância do WhatsApp encontrada para esta empresa");
      }

      // Prepare lead data without contacts
      const { contacts, ...leadData } = data;
      
      const { data: insertData, error } = await supabase
        .from("leads")
        .insert({
          ...leadData,
          company_id: companyId,
          whatsapp_number_id: whatsappNumberId,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert contacts if provided
      if (contacts && contacts.length > 0) {
        const contactsToInsert = contacts.map(contact => ({
          lead_id: insertData.id,
          contact_type: contact.contact_type,
          contact_value: contact.contact_value,
          is_primary: contact.is_primary || false,
        }));

        const { error: contactsError } = await supabase
          .from("lead_contacts")
          .insert(contactsToInsert);

        if (contactsError) {
          console.error("Erro ao inserir contatos:", contactsError);
          // Don't throw here as the lead was created successfully
        }
      }

      return insertData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
      toast.success("Cliente criado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar cliente:", error);
      toast.error("Erro ao criar cliente");
    },
  });
}

export function useUpdateClientMutation(companyId: string) {
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
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar cliente:", error);
      toast.error("Erro ao atualizar cliente");
    },
  });
}

export function useDeleteClientMutation(companyId: string) {
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
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
      toast.success("Cliente removido com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao remover cliente:", error);
      toast.error("Erro ao remover cliente");
    },
  });
}
