
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientData } from "./types";
import { useClientsFilters } from "@/hooks/shared/filters";
import { useUserPermissions } from "@/hooks/useUserPermissions";

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

// Hook principal com paginação infinita com filtros por role
export const useClientsQuery = (userId: string | null, searchQuery: string = "") => {
  const dataFilters = useClientsFilters();
  const { permissions } = useUserPermissions();
  
  return useInfiniteQuery({
    queryKey: ["clients", userId, searchQuery, dataFilters.role, permissions.role],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }): Promise<{
      data: ClientData[];
      nextCursor: number | undefined;
      hasMore: boolean;
      totalCount: number;
    }> => {
      if (!userId || dataFilters.loading || !dataFilters.role) {
        return { data: [], nextCursor: undefined, hasMore: false, totalCount: 0 };
      }
      
      console.log('[Clients Query] 📊 Carregando clientes com filtros de role:', {
        pageParam,
        limit: CLIENTS_PER_PAGE,
        userId,
        role: dataFilters.role,
        leadsFilter: dataFilters.leadsFilter
      });
      
      // Aplicar filtros baseados no role do usuário
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
        .order("created_at", { ascending: false });

      // 🎯 APLICAR FILTROS POR ROLE (igual ao funil de vendas)
      if (dataFilters.role === 'admin') {
        // ADMIN: Vê leads que ele criou
        query = query.eq("created_by_user_id", userId);
        console.log('[Clients Query] 👑 ADMIN - Filtrando por created_by_user_id:', userId);
      } else if (dataFilters.role === 'operational' && dataFilters.leadsFilter) {
        // OPERACIONAL: Usar filtros do useDataFilters
        if (dataFilters.leadsFilter.whatsapp_number_id) {
          query = query.in("whatsapp_number_id", dataFilters.leadsFilter.whatsapp_number_id.in);
          console.log('[Clients Query] 🎯 OPERACIONAL - Filtrando por whatsapp_number_id:', dataFilters.leadsFilter.whatsapp_number_id.in);
        } else if (dataFilters.leadsFilter.owner_id) {
          query = query.eq("owner_id", dataFilters.leadsFilter.owner_id);
          console.log('[Clients Query] 🎯 OPERACIONAL - Filtrando por owner_id:', dataFilters.leadsFilter.owner_id);
        }
      }

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
    enabled: !!userId && !dataFilters.loading && !!dataFilters.role,
    staleTime: 1000 * 60 * 15, // 🔧 OTIMIZAÇÃO: 15 minutos cache para clientes
    gcTime: 1000 * 60 * 30, // 30 minutos garbage collection
  });
};

// Hook para buscar opções de filtros
export const useFilterOptions = (userId: string | null) => {
  const dataFilters = useClientsFilters();
  
  return useQuery({
    queryKey: ["filter-options", userId, dataFilters.role],
    queryFn: async () => {
      if (!userId || dataFilters.loading || !dataFilters.role) return null;

      console.log('[Filter Options] 🔍 Buscando opções de filtro para role:', dataFilters.role);

      // Aplicar filtros baseados no role
      let tagQuery = supabase.from("tags").select("id, name, color").order("name");
      let userQuery = supabase.from("profiles").select("id, full_name").order("full_name");
      let funnelQuery = supabase.from("funnels").select("id, name").order("name");
      let stagesQuery = supabase.from("kanban_stages").select("id, title").order("order_position");
      let leadsQuery = supabase.from("leads");

      if (dataFilters.role === 'admin') {
        // ADMIN: Vê recursos criados por ele
        tagQuery = tagQuery.eq("created_by_user_id", userId);
        userQuery = userQuery.eq("created_by_user_id", userId);
        funnelQuery = funnelQuery.eq("created_by_user_id", userId);
        stagesQuery = stagesQuery.eq("created_by_user_id", userId);
        leadsQuery = leadsQuery.eq("created_by_user_id", userId);
        console.log('[Filter Options] 👑 ADMIN - Buscando recursos criados pelo admin');
      } else if (dataFilters.role === 'operational') {
        // OPERACIONAL: Usar filtros específicos dos recursos atribuídos
        if (dataFilters.leadsFilter?.whatsapp_number_id) {
          leadsQuery = leadsQuery.in("whatsapp_number_id", dataFilters.leadsFilter.whatsapp_number_id.in);
          console.log('[Filter Options] 🎯 OPERACIONAL - Filtrando por instâncias WhatsApp atribuídas');
        } else if (dataFilters.leadsFilter?.owner_id) {
          leadsQuery = leadsQuery.eq("owner_id", dataFilters.leadsFilter.owner_id);
          console.log('[Filter Options] 🎯 OPERACIONAL - Filtrando por owner_id');
        }
        
        // Para operacionais, os filtros de tags, usuários, funis, etc. podem ser limitados
        // vamos manter as queries sem filtro adicional por enquanto, mas os leads já são filtrados
      }

      // Buscar dados
      const { data: tagsData } = await tagQuery;
      const { data: usersData } = await userQuery;
      const { data: funnelsData } = await funnelQuery;
      const { data: stagesData } = await stagesQuery;

      // Buscar dados únicos dos leads (com filtros aplicados)
      const { data: statesData } = await leadsQuery
        .select("state")
        .not("state", "is", null);

      const { data: citiesData } = await leadsQuery
        .select("city")
        .not("city", "is", null);

      const { data: countriesData } = await leadsQuery
        .select("country")
        .not("country", "is", null);

      const { data: companiesData } = await leadsQuery
        .select("company")
        .not("company", "is", null);

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
    enabled: !!userId && !dataFilters.loading && !!dataFilters.role,
    staleTime: 1000 * 60 * 20, // 🔧 OTIMIZAÇÃO: 20 minutos para filtros (mudam pouco)
    gcTime: 1000 * 60 * 45, // 45 minutos garbage collection
  });
};

// Hook para buscar clientes com filtros avançados
export const useFilteredClientsQuery = (
  userId: string | null, 
  searchQuery: string = "",
  filters: any = {}
) => {
  const dataFilters = useClientsFilters();
  
  return useQuery({
    queryKey: ["filtered-clients", userId, searchQuery, filters, dataFilters.role],
    queryFn: async (): Promise<ClientData[]> => {
      if (!userId || dataFilters.loading || !dataFilters.role) return [];
      
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
        .order("created_at", { ascending: false });

      // 🎯 APLICAR FILTROS POR ROLE (igual aos outros hooks)
      if (dataFilters.role === 'admin') {
        query = query.eq("created_by_user_id", userId);
        console.log('[Filtered Clients] 👑 ADMIN - Filtrando por created_by_user_id:', userId);
      } else if (dataFilters.role === 'operational' && dataFilters.leadsFilter) {
        if (dataFilters.leadsFilter.whatsapp_number_id) {
          query = query.in("whatsapp_number_id", dataFilters.leadsFilter.whatsapp_number_id.in);
          console.log('[Filtered Clients] 🎯 OPERACIONAL - Filtrando por whatsapp_number_id');
        } else if (dataFilters.leadsFilter.owner_id) {
          query = query.eq("owner_id", dataFilters.leadsFilter.owner_id);
          console.log('[Filtered Clients] 🎯 OPERACIONAL - Filtrando por owner_id');
        }
      }

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
    enabled: !!userId && !dataFilters.loading && !!dataFilters.role,
    staleTime: 1000 * 60 * 5, // 🔧 OTIMIZAÇÃO: 5 minutos para filtros avançados
    gcTime: 1000 * 60 * 15, // 15 minutos garbage collection
  });
};
