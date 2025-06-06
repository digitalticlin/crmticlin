
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cleanPhoneNumber, validatePhone } from "@/utils/phoneFormatter";
import { ClientFormData, LeadContact } from "./types";

const saveLeadContacts = async (leadId: string, contacts: LeadContact[]) => {
  // Primeiro, deletar contatos existentes
  await supabase
    .from("lead_contacts")
    .delete()
    .eq("lead_id", leadId);

  // Inserir novos contatos
  if (contacts.length > 0) {
    const contactsToInsert = contacts.map(contact => ({
      lead_id: leadId,
      contact_type: contact.contact_type,
      contact_value: contact.contact_value,
      is_primary: contact.is_primary,
    }));

    const { error: contactsError } = await supabase
      .from("lead_contacts")
      .insert(contactsToInsert);

    if (contactsError) {
      throw new Error("Erro ao salvar contatos: " + contactsError.message);
    }
  }
};

export const useCreateClientMutation = (companyId: string | null, defaultWhatsAppInstanceId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData: ClientFormData) => {
      if (!companyId) {
        throw new Error("Company ID não encontrado");
      }

      if (!defaultWhatsAppInstanceId) {
        throw new Error("Nenhuma instância WhatsApp encontrada. Configure uma instância WhatsApp primeiro.");
      }

      // Validar contato principal
      const primaryPhone = clientData.contacts.find(c => c.contact_type === 'phone' && c.is_primary);
      if (!primaryPhone?.contact_value) {
        throw new Error("É necessário um telefone principal");
      }

      // Limpar e validar telefone principal
      const cleanPhone = cleanPhoneNumber(primaryPhone.contact_value);
      if (!validatePhone(cleanPhone)) {
        throw new Error("Telefone principal inválido");
      }

      // Verificar se já existe um cliente com este telefone
      const { data: existingClient } = await supabase
        .from("leads")
        .select("id")
        .eq("phone", cleanPhone)
        .eq("company_id", companyId)
        .maybeSingle();

      if (existingClient) {
        throw new Error("Já existe um cliente com este telefone");
      }

      // Buscar email principal
      const primaryEmail = clientData.contacts.find(c => c.contact_type === 'email' && c.is_primary);

      // Criar o lead
      const leadData = {
        name: clientData.name,
        phone: cleanPhone,
        email: primaryEmail?.contact_value || null,
        address: clientData.address || null,
        city: clientData.city || null,
        state: clientData.state || null,
        country: clientData.country || 'Brasil',
        zip_code: clientData.zip_code || null,
        company: clientData.company || null,
        notes: clientData.notes || null,
        purchase_value: clientData.purchase_value || null,
        document_type: clientData.document_type || null,
        document_id: clientData.document_id || null,
        company_id: companyId,
        whatsapp_number_id: defaultWhatsAppInstanceId,
      };

      const { data: newLead, error } = await supabase
        .from("leads")
        .insert(leadData)
        .select()
        .single();

      if (error) throw error;

      // Salvar contatos
      await saveLeadContacts(newLead.id, clientData.contacts);

      return newLead;
    },
    onSuccess: () => {
      toast.success("Cliente criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar cliente");
    },
  });
};

export const useUpdateClientMutation = (companyId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      const updateData: any = { ...data };
      
      // Se estiver atualizando contatos, validar telefone principal
      if (data.contacts) {
        const primaryPhone = data.contacts.find(c => c.contact_type === 'phone' && c.is_primary);
        if (primaryPhone?.contact_value) {
          const cleanPhone = cleanPhoneNumber(primaryPhone.contact_value);
          if (!validatePhone(cleanPhone)) {
            throw new Error("Telefone principal inválido");
          }
          updateData.phone = cleanPhone;
          
          // Buscar email principal
          const primaryEmail = data.contacts.find(c => c.contact_type === 'email' && c.is_primary);
          updateData.email = primaryEmail?.contact_value || null;
        }
      }

      // Remover contatos do updateData já que será tratado separadamente
      const { contacts, ...leadUpdateData } = updateData;

      // Atualizar o lead
      const { data: updatedData, error } = await supabase
        .from("leads")
        .update(leadUpdateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Atualizar contatos se fornecidos
      if (data.contacts) {
        await saveLeadContacts(id, data.contacts);
      }

      return updatedData;
    },
    onSuccess: () => {
      toast.success("Cliente atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar cliente");
    },
  });
};

export const useDeleteClientMutation = (companyId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      // Os contatos serão deletados automaticamente devido ao CASCADE
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente deletado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao deletar cliente");
    },
  });
};
