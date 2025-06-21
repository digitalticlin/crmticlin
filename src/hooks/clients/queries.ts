
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientData } from "./types";

export const useDefaultWhatsAppInstance = (userId: string | null) => {
  return useQuery({
    queryKey: ["default-whatsapp", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("whatsapp_instances")
        .select("id")
        .eq("created_by_user_id", userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar instância WhatsApp:", error);
        return null;
      }

      return data;
    },
    enabled: !!userId,
  });
};

export const useClientsQuery = (userId: string | null) => {
  return useQuery({
    queryKey: ["clients", userId],
    queryFn: async (): Promise<ClientData[]> => {
      if (!userId) return [];
      
      // Buscar leads do usuário
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .eq("created_by_user_id", userId)
        .order("created_at", { ascending: false });

      if (leadsError) {
        console.error("Erro ao buscar clientes:", leadsError);
        throw leadsError;
      }

      // Mapear leads para o formato ClientData
      const clientsData: ClientData[] = (leadsData || []).map(lead => ({
        id: lead.id,
        name: lead.name || "Nome não informado",
        phone: lead.phone,
        email: lead.email,
        address: lead.address,
        company: lead.company,
        notes: lead.notes,
        purchase_value: lead.purchase_value,
        document_type: undefined, // Não temos este campo na nova estrutura
        document_id: lead.document_id,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        created_by_user_id: lead.created_by_user_id,
        contacts: [], // Não temos tabela separada de contatos
      }));

      return clientsData;
    },
    enabled: !!userId,
  });
};
