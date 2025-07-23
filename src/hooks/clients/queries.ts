
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientData } from "./types";

const CLIENTS_PER_PAGE = 50;

// Hook para buscar instância padrão do WhatsApp
export const useDefaultWhatsAppInstance = (userId: string | null) => {
  return useQuery({
    queryKey: ["default-whatsapp-instance", userId],
    queryFn: async (): Promise<{ id: string; instance_name: string } | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("whatsapp_instances")
        .select("id, instance_name")
        .eq("created_by_user_id", userId)
        .eq("connection_status", "connected")
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar instância do WhatsApp:", error);
        return null;
      }

      return data;
    },
    enabled: !!userId,
  });
};

// Hook principal com paginação infinita
export const useClientsQuery = (userId: string | null) => {
  return useInfiniteQuery({
    queryKey: ["clients", userId],
    queryFn: async ({ pageParam = 0 }): Promise<{
      data: ClientData[];
      nextCursor: number | undefined;
      hasMore: boolean;
    }> => {
      if (!userId) return { data: [], nextCursor: undefined, hasMore: false };
      
      console.log('[Clients Query] 📊 Carregando página:', {
        pageParam,
        limit: CLIENTS_PER_PAGE,
        userId
      });
      
      // Buscar leads do usuário com paginação
      const { data: leadsData, error: leadsError, count } = await supabase
        .from("leads")
        .select("*", { count: 'exact' })
        .eq("created_by_user_id", userId)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + CLIENTS_PER_PAGE - 1);

      if (leadsError) {
        console.error("Erro ao buscar clientes:", leadsError);
        throw leadsError;
      }

      console.log('[Clients Query] ✅ Dados carregados:', {
        receivedCount: leadsData?.length || 0,
        totalCount: count,
        currentOffset: pageParam,
        hasMore: (leadsData?.length || 0) === CLIENTS_PER_PAGE
      });

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

      const hasMore = (leadsData?.length || 0) === CLIENTS_PER_PAGE;
      const nextCursor = hasMore ? pageParam + CLIENTS_PER_PAGE : undefined;

      return {
        data: clientsData,
        nextCursor,
        hasMore
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!userId,
    initialPageParam: 0,
  });
};
