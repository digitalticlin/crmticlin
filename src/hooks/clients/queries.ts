
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientData } from "./types";

const CLIENTS_PER_PAGE = 50;
const SEARCH_LIMIT = 500; // Limite de segurança para buscas

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
export const useClientsQuery = (userId: string | null, searchQuery: string = "") => {
  return useInfiniteQuery({
    queryKey: ["clients", userId, searchQuery],
    queryFn: async ({ pageParam = 0 }): Promise<{
      data: ClientData[];
      nextCursor: number | undefined;
      hasMore: boolean;
      totalCount: number;
    }> => {
      if (!userId) return { data: [], nextCursor: undefined, hasMore: false };
      
      console.log('[Clients Query] 📊 Carregando página:', {
        pageParam,
        limit: CLIENTS_PER_PAGE,
        userId
      });
      
      // Buscar leads do usuário com paginação
      let query = supabase
        .from("leads")
        .select("*", { count: 'exact' })
        .eq("created_by_user_id", userId)
        .order("created_at", { ascending: false });

      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim();
        const ilike = `%${q}%`;
        query = query.or(
          `name.ilike.${ilike},phone.ilike.${ilike},email.ilike.${ilike},company.ilike.${ilike}`
        );
      }

      // 🚀 CORREÇÃO CRÍTICA: Em modo de busca, usar limite de segurança para performance
      let leadsData, leadsError, count;
      if (searchQuery && searchQuery.trim()) {
        // Busca com limite de segurança - performance otimizada
        console.log('[Clients Query] 🔍 Busca com limite de segurança (500 resultados)');
        const result = await query.limit(SEARCH_LIMIT);
        leadsData = result.data;
        leadsError = result.error;
        count = result.data?.length || 0;
        
        // Log se atingiu o limite
        if (count === SEARCH_LIMIT) {
          console.warn('[Clients Query] ⚠️ Busca atingiu limite de 500 resultados');
        }
      } else {
        // Paginação normal quando não está pesquisando
        console.log('[Clients Query] 📄 Carregamento paginado normal');
        const result = await query.range(pageParam, pageParam + CLIENTS_PER_PAGE - 1);
        leadsData = result.data;
        leadsError = result.error;
        count = result.count;
      }

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

      // 🚀 Em modo de busca, não há mais páginas (todos os resultados carregados)
      const hasMore = searchQuery && searchQuery.trim() ? false : (leadsData?.length || 0) === CLIENTS_PER_PAGE;
      const nextCursor = hasMore ? pageParam + CLIENTS_PER_PAGE : undefined;

      return {
        data: clientsData,
        nextCursor,
        hasMore,
        totalCount: count || 0
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!userId,
    initialPageParam: 0,
  });
};
