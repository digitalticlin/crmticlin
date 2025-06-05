
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientData } from "./types";

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
      
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        throw error;
      }

      // Mapear os dados da tabela leads para nossa interface ClientData
      return (data || []).map(lead => ({
        id: lead.id,
        name: lead.name || "Nome não informado",
        phone: lead.phone,
        email: lead.email,
        address: lead.address,
        company: lead.company,
        notes: lead.notes,
        purchase_value: lead.purchase_value,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        company_id: lead.company_id,
      }));
    },
    enabled: !!companyId,
  });
};
