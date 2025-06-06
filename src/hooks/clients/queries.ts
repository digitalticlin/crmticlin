
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientData, LeadContact } from "./types";

export const useDefaultWhatsAppInstance = (companyId: string | null) => {
  return useQuery({
    queryKey: ["default-whatsapp", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const { data, error } = await supabase
        .from("whatsapp_instances")
        .select("id")
        .eq("company_id", companyId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar instância WhatsApp:", error);
        return null;
      }

      return data;
    },
    enabled: !!companyId,
  });
};

export const useClientsQuery = (companyId: string | null) => {
  return useQuery({
    queryKey: ["clients", companyId],
    queryFn: async (): Promise<ClientData[]> => {
      if (!companyId) return [];
      
      // Buscar leads
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (leadsError) {
        console.error("Erro ao buscar clientes:", leadsError);
        throw leadsError;
      }

      // Buscar contatos para cada lead
      const clientsWithContacts = await Promise.all(
        (leadsData || []).map(async (lead) => {
          const { data: contactsData } = await supabase
            .from("lead_contacts")
            .select("*")
            .eq("lead_id", lead.id)
            .order("is_primary", { ascending: false });

          const contacts: LeadContact[] = (contactsData || []).map(contact => ({
            id: contact.id,
            contact_type: contact.contact_type as 'phone' | 'email' | 'whatsapp',
            contact_value: contact.contact_value,
            is_primary: contact.is_primary,
          }));

          return {
            id: lead.id,
            name: lead.name || "Nome não informado",
            phone: lead.phone,
            email: lead.email,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            country: lead.country,
            zip_code: lead.zip_code,
            company: lead.company,
            notes: lead.notes,
            purchase_value: lead.purchase_value,
            document_type: lead.document_type as 'cpf' | 'cnpj' | undefined,
            document_id: lead.document_id,
            created_at: lead.created_at,
            updated_at: lead.updated_at,
            company_id: lead.company_id,
            contacts,
          } as ClientData;
        })
      );

      return clientsWithContacts;
    },
    enabled: !!companyId,
  });
};
