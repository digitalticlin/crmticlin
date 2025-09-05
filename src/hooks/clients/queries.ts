
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
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }): Promise<{
      data: ClientData[];
      nextCursor: number | undefined;
      hasMore: boolean;
      totalCount: number;
    }> => {
      if (!userId) return { data: [], nextCursor: undefined, hasMore: false, totalCount: 0 };
      
      console.log('[Clients Query] 📊 Carregando página:', {
        pageParam,
        limit: CLIENTS_PER_PAGE,
        userId
      });
      
      // Buscar leads do usuário com paginação incluindo tags
      let query = supabase
        .from("leads")
        .select(`
          *,
          lead_tags(
            tags(
              id,
              name,
              color
            )
          )
        `, { count: 'exact' })
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

      // Transformar dados para incluir tags no formato correto
      const transformedData: ClientData[] = (leadsData || []).map(lead => ({
        ...lead,
        tags: lead.lead_tags?.map((lt: any) => lt.tags).filter(Boolean) || []
      }));

      console.log('[Clients Query] ✅ Dados carregados:', {
        receivedCount: transformedData?.length || 0,
        totalCount: count,
        currentOffset: pageParam,
        hasMore: (transformedData?.length || 0) === CLIENTS_PER_PAGE
      });

      // Determinar se há mais páginas e próximo cursor
      const hasMore = searchQuery && searchQuery.trim() 
        ? false // Em modo busca, não há paginação
        : (transformedData?.length || 0) === CLIENTS_PER_PAGE;
      
      const nextCursor = hasMore ? pageParam + CLIENTS_PER_PAGE : undefined;

      return {
        data: transformedData,
        nextCursor,
        hasMore,
        totalCount: count || 0
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para buscar opções de filtros
export const useFilterOptions = (userId: string | null) => {
  return useQuery({
    queryKey: ["filter-options", userId],
    queryFn: async () => {
      if (!userId) return null;

      // Buscar todas as tags do usuário
      const { data: tagsData } = await supabase
        .from("tags")
        .select("id, name, color")
        .eq("created_by_user_id", userId)
        .order("name");

      // Buscar usuários responsáveis
      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("created_by_user_id", userId) // Corrigir: usar created_by_user_id baseado no schema
        .order("full_name");

      // Buscar funis
      const { data: funnelsData } = await supabase
        .from("funnels")
        .select("id, name")
        .eq("created_by_user_id", userId) // Ajustar conforme a estrutura real de funis
        .order("name");

      // Buscar etapas de funis
      const { data: stagesData } = await supabase
        .from("kanban_stages")
        .select("id, title")
        .eq("created_by_user_id", userId) // Ajustar conforme a estrutura real de etapas
        .order("order_position");

      // Buscar estados únicos  
      const { data: statesData } = await supabase
        .from("leads")
        .select("state")
        .eq("created_by_user_id", userId)
        .not("state", "is", null)
        .order("state");

      // Buscar cidades únicas
      const { data: citiesData } = await supabase
        .from("leads")
        .select("city")
        .eq("created_by_user_id", userId)
        .not("city", "is", null)
        .order("city");

      // Buscar países únicos
      const { data: countriesData } = await supabase
        .from("leads")
        .select("country")
        .eq("created_by_user_id", userId)
        .not("country", "is", null)
        .order("country");

      // Buscar empresas únicas
      const { data: companiesData } = await supabase
        .from("leads")
        .select("company")
        .eq("created_by_user_id", userId)
        .not("company", "is", null)
        .order("company");

      return {
        tags: tagsData || [],
        companies: [...new Set((companiesData || []).map(c => c.company).filter(Boolean))],
        responsibleUsers: (usersData || []).map(u => ({ id: u.id, name: u.full_name })),
        funnelIds: funnelsData || [],
        funnelStages: stagesData || [],
        states: [...new Set((statesData || []).map(s => s.state).filter(Boolean))],
        cities: [...new Set((citiesData || []).map(c => c.city).filter(Boolean))],
        countries: [...new Set((countriesData || []).map(c => c.country).filter(Boolean))]
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
};

// Hook para buscar clientes com filtros avançados
export const useFilteredClientsQuery = (
  userId: string | null, 
  searchQuery: string = "",
  filters: any = {}
) => {
  return useQuery({
    queryKey: ["filtered-clients", userId, searchQuery, filters],
    queryFn: async (): Promise<ClientData[]> => {
      if (!userId) return [];
      
      let query = supabase
        .from("leads")
        .select(`
          *,
          lead_tags(
            tags(
              id,
              name,
              color
            )
          )
        `)
        .eq("created_by_user_id", userId)
        .order("created_at", { ascending: false });

      // Aplicar filtros de busca
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim();
        const ilike = `%${q}%`;
        query = query.or(
          `name.ilike.${ilike},phone.ilike.${ilike},email.ilike.${ilike},company.ilike.${ilike}`
        );
      }

      // Aplicar filtros específicos
      if (filters.companies && filters.companies.length > 0) {
        query = query.in("company", filters.companies);
      }

      if (filters.states && filters.states.length > 0) {
        query = query.in("state", filters.states);
      }

      if (filters.cities && filters.cities.length > 0) {
        query = query.in("city", filters.cities);
      }

      if (filters.countries && filters.countries.length > 0) {
        query = query.in("country", filters.countries);
      }

      if (filters.dateRange) {
        if (filters.dateRange.from) {
          query = query.gte("created_at", filters.dateRange.from.toISOString());
        }
        if (filters.dateRange.to) {
          query = query.lte("created_at", filters.dateRange.to.toISOString());
        }
      }

      if (filters.responsibleUsers && filters.responsibleUsers.length > 0) {
        query = query.in("owner_id", filters.responsibleUsers);
      }

      if (filters.funnelIds && filters.funnelIds.length > 0) {
        query = query.in("funnel_id", filters.funnelIds);
      }

      if (filters.funnelStages && filters.funnelStages.length > 0) {
        query = query.in("kanban_stage_id", filters.funnelStages);
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;

      // Transformar dados
      let transformedData: ClientData[] = (data || []).map(lead => ({
        ...lead,
        tags: lead.lead_tags?.map((lt: any) => lt.tags).filter(Boolean) || []
      }));

      // Filtrar por tags se especificado
      if (filters.tags && filters.tags.length > 0) {
        transformedData = transformedData.filter(client => 
          client.tags?.some(tag => filters.tags.includes(tag.id))
        );
      }

      return transformedData;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};
