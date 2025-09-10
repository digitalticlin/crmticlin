/**
 * 🚀 CLIENTS ISOLADO E OTIMIZADO
 * 
 * ISOLAMENTO COMPLETO:
 * ✅ Query keys com namespace específico (CLIENTS-*)
 * ✅ Cache otimizado por tipo de operação
 * ✅ Memoização de operações custosas
 * ✅ Debounce em buscas e filtros
 * ✅ Virtualização para grandes listas
 * ✅ Zero interferência com outras páginas
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useClientsFilters } from "@/hooks/shared/filters";
import { ClientData, ClientFormData } from "./types";
import { toast } from "sonner";

// ✅ QUERY KEYS ISOLADAS - NAMESPACE ÚNICO
const clientsQueryKeys = {
  base: ['CLIENTS'] as const,
  all: (userId: string, role: string) => 
    [...clientsQueryKeys.base, 'all', userId, role] as const,
  search: (userId: string, query: string, role: string) => 
    [...clientsQueryKeys.base, 'search', userId, query, role] as const,
  filtered: (userId: string, filters: any, role: string) => 
    [...clientsQueryKeys.base, 'filtered', userId, JSON.stringify(filters), role] as const,
  details: (clientId: string) => 
    [...clientsQueryKeys.base, 'details', clientId] as const,
  whatsapp: (userId: string) => 
    [...clientsQueryKeys.base, 'whatsapp', userId] as const,
  filterOptions: (userId: string, role: string) => 
    [...clientsQueryKeys.base, 'filterOptions', userId, role] as const
};

// ✅ CONSTANTES OTIMIZADAS
const CLIENTS_PER_PAGE = 50;
const SEARCH_LIMIT = 500;
const DEBOUNCE_DELAY = 300;
const SCROLL_THRESHOLD = 200;

// ✅ DEBOUNCE HOOK ISOLADO
const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// ✅ TIPOS ISOLADOS
interface ClientsState {
  searchQuery: string;
  selectedClient: ClientData | null;
  isDetailsOpen: boolean;
  isCreateMode: boolean;
  viewMode: 'table' | 'grid' | 'kanban';
  sortBy: 'name' | 'created_at' | 'purchase_value';
  sortOrder: 'asc' | 'desc';
}

interface FilterState {
  companies: string[];
  states: string[];
  cities: string[];
  countries: string[];
  tags: string[];
  responsibleUsers: string[];
  funnelIds: string[];
  funnelStages: string[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

export function useClientsOptimized() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { userFunnels, canViewAllFunnels, isLoading: accessLoading } = useAccessControl();
  const dataFilters = useClientsFilters();

  // ✅ ESTADO CLIENTS ISOLADO
  const [clientsState, setClientsState] = useState<ClientsState>({
    searchQuery: '',
    selectedClient: null,
    isDetailsOpen: false,
    isCreateMode: false,
    viewMode: 'table',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [filters, setFilters] = useState<FilterState>({
    companies: [],
    states: [],
    cities: [],
    countries: [],
    tags: [],
    responsibleUsers: [],
    funnelIds: [],
    funnelStages: []
  });

  // ✅ DEBOUNCE - Evita queries excessivas
  const debouncedSearchQuery = useDebouncedValue(clientsState.searchQuery, DEBOUNCE_DELAY);
  const debouncedFilters = useDebouncedValue(filters, DEBOUNCE_DELAY);

  // ✅ VERIFICAR SE HÁ FILTROS ATIVOS
  const hasActiveFilters = useMemo(() => 
    Object.values(filters).some(filter => {
      if (Array.isArray(filter)) return filter.length > 0;
      if (filter && typeof filter === 'object' && 'from' in filter) {
        return filter.from || filter.to;
      }
      return false;
    }),
    [filters]
  );

  // ✅ QUERY ISOLADA - WhatsApp Instance
  const { data: defaultWhatsAppInstance } = useQuery({
    queryKey: clientsQueryKeys.whatsapp(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("whatsapp_instances")
        .select("id, instance_name")
        .eq("created_by_user_id", user.id)
        .eq("connection_status", "connected")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000
  });

  // ✅ QUERY ISOLADA - Filter Options
  const { data: filterOptions, isLoading: filterOptionsLoading } = useQuery({
    queryKey: clientsQueryKeys.filterOptions(user?.id || '', dataFilters.role || ''),
    queryFn: async () => {
      if (!user?.id || !dataFilters.role) return null;

      console.log('🚀 [Clients] Buscando opções de filtro isoladas:', {
        userId: user.id,
        role: dataFilters.role
      });

      // Aplicar filtros baseados no role
      let tagQuery = supabase.from("tags").select("id, name, color").order("name");
      let userQuery = supabase.from("profiles").select("id, full_name").order("full_name");
      let funnelQuery = supabase.from("funnels").select("id, name").order("name");
      let stagesQuery = supabase.from("kanban_stages").select("id, title").order("order_position");
      let leadsQuery = supabase.from("leads");

      if (dataFilters.role === 'admin') {
        tagQuery = tagQuery.eq("created_by_user_id", user.id);
        userQuery = userQuery.eq("created_by_user_id", user.id);
        funnelQuery = funnelQuery.eq("created_by_user_id", user.id);
        stagesQuery = stagesQuery.eq("created_by_user_id", user.id);
        leadsQuery = leadsQuery.eq("created_by_user_id", user.id);
      } else if (dataFilters.role === 'operational') {
        if (dataFilters.leadsFilter?.whatsapp_number_id) {
          leadsQuery = leadsQuery.in("whatsapp_number_id", dataFilters.leadsFilter.whatsapp_number_id.in);
        } else if (dataFilters.leadsFilter?.owner_id) {
          leadsQuery = leadsQuery.eq("owner_id", dataFilters.leadsFilter.owner_id);
        }
      }

      // Buscar todos os dados em paralelo
      const [tagsResult, usersResult, funnelsResult, stagesResult, statesResult, citiesResult, countriesResult, companiesResult] = await Promise.all([
        tagQuery,
        userQuery,
        funnelQuery,
        stagesQuery,
        leadsQuery.select("state").not("state", "is", null),
        leadsQuery.select("city").not("city", "is", null),
        leadsQuery.select("country").not("country", "is", null),
        leadsQuery.select("company").not("company", "is", null)
      ]);

      return {
        tags: tagsResult.data || [],
        companies: [...new Set((companiesResult.data || []).map(c => c.company).filter(Boolean))],
        responsibleUsers: (usersResult.data || []).map(u => ({ id: u.id, name: u.full_name })),
        funnelIds: funnelsResult.data || [],
        funnelStages: stagesResult.data || [],
        states: [...new Set((statesResult.data || []).map(s => s.state).filter(Boolean))],
        cities: [...new Set((citiesResult.data || []).map(c => c.city).filter(Boolean))],
        countries: [...new Set((countriesResult.data || []).map(c => c.country).filter(Boolean))]
      };
    },
    enabled: !!user?.id && !dataFilters.loading && !!dataFilters.role && !accessLoading,
    staleTime: 15 * 60 * 1000, // 15 minutos - filtros mudam pouco
    gcTime: 30 * 60 * 1000
  });

  // ✅ QUERY ISOLADA - Clients com filtros avançados
  const { 
    data: filteredClientsData, 
    isLoading: filteredClientsLoading,
    refetch: refetchFilteredClients
  } = useQuery({
    queryKey: clientsQueryKeys.filtered(
      user?.id || '', 
      debouncedFilters, 
      dataFilters.role || ''
    ),
    queryFn: async (): Promise<ClientData[]> => {
      if (!user?.id || !dataFilters.role) return [];
      
      console.log('🚀 [Clients] Buscando clientes filtrados isolados:', {
        userId: user.id,
        role: dataFilters.role,
        filters: debouncedFilters,
        hasActiveFilters
      });

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
        .order(clientsState.sortBy === 'created_at' ? 'created_at' : clientsState.sortBy, 
               { ascending: clientsState.sortOrder === 'asc' });

      // Aplicar filtros por role
      if (dataFilters.role === 'admin') {
        query = query.eq("created_by_user_id", user.id);
      } else if (dataFilters.role === 'operational' && dataFilters.leadsFilter) {
        if (dataFilters.leadsFilter.whatsapp_number_id) {
          query = query.in("whatsapp_number_id", dataFilters.leadsFilter.whatsapp_number_id.in);
        } else if (dataFilters.leadsFilter.owner_id) {
          query = query.eq("owner_id", dataFilters.leadsFilter.owner_id);
        }
      }

      // Aplicar filtros específicos
      if (debouncedFilters.companies.length > 0) {
        query = query.in("company", debouncedFilters.companies);
      }

      if (debouncedFilters.states.length > 0) {
        query = query.in("state", debouncedFilters.states);
      }

      if (debouncedFilters.cities.length > 0) {
        query = query.in("city", debouncedFilters.cities);
      }

      if (debouncedFilters.countries.length > 0) {
        query = query.in("country", debouncedFilters.countries);
      }

      if (debouncedFilters.responsibleUsers.length > 0) {
        query = query.in("owner_id", debouncedFilters.responsibleUsers);
      }

      if (debouncedFilters.funnelIds.length > 0) {
        query = query.in("funnel_id", debouncedFilters.funnelIds);
      }

      if (debouncedFilters.funnelStages.length > 0) {
        query = query.in("kanban_stage_id", debouncedFilters.funnelStages);
      }

      if (debouncedFilters.dateRange?.from) {
        query = query.gte("created_at", debouncedFilters.dateRange.from.toISOString());
      }

      if (debouncedFilters.dateRange?.to) {
        query = query.lte("created_at", debouncedFilters.dateRange.to.toISOString());
      }

      const { data, error } = await query.limit(SEARCH_LIMIT);
      if (error) throw error;

      // Transformar dados
      let transformedData: ClientData[] = (data || []).map(lead => ({
        ...lead,
        tags: lead.lead_tags?.map((lt: any) => lt.tags).filter(Boolean) || []
      }));

      // Filtrar por tags (precisa ser feito no client)
      if (debouncedFilters.tags.length > 0) {
        transformedData = transformedData.filter(client => 
          client.tags?.some(tag => debouncedFilters.tags.includes(tag.id))
        );
      }

      return transformedData;
    },
    enabled: !!user?.id && !dataFilters.loading && !!dataFilters.role && !accessLoading && hasActiveFilters,
    staleTime: 2 * 60 * 1000, // 2 minutos para filtros ativos
    gcTime: 5 * 60 * 1000
  });

  // ✅ QUERY ISOLADA - Clients com paginação infinita
  const clientsInfiniteQuery = useInfiniteQuery({
    queryKey: clientsQueryKeys.search(
      user?.id || '', 
      debouncedSearchQuery, 
      dataFilters.role || ''
    ),
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id || !dataFilters.role) {
        return { data: [], nextCursor: undefined, hasMore: false, totalCount: 0 };
      }

      console.log('🚀 [Clients] Carregando página isolada:', {
        pageParam,
        userId: user.id,
        role: dataFilters.role,
        searchQuery: debouncedSearchQuery
      });

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
        .order(clientsState.sortBy === 'created_at' ? 'created_at' : clientsState.sortBy, 
               { ascending: clientsState.sortOrder === 'asc' });

      // Aplicar filtros por role
      if (dataFilters.role === 'admin') {
        query = query.eq("created_by_user_id", user.id);
      } else if (dataFilters.role === 'operational' && dataFilters.leadsFilter) {
        if (dataFilters.leadsFilter.whatsapp_number_id) {
          query = query.in("whatsapp_number_id", dataFilters.leadsFilter.whatsapp_number_id.in);
        } else if (dataFilters.leadsFilter.owner_id) {
          query = query.eq("owner_id", dataFilters.leadsFilter.owner_id);
        }
      }

      // Aplicar busca
      if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.trim();
        const ilike = `%${q}%`;
        query = query.or(
          `name.ilike.${ilike},phone.ilike.${ilike},email.ilike.${ilike},company.ilike.${ilike}`
        );
      }

      // Paginação
      let leadsData, leadsError, count;
      if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
        // Busca com limite
        const result = await query.limit(SEARCH_LIMIT);
        leadsData = result.data;
        leadsError = result.error;
        count = result.data?.length || 0;
      } else {
        // Paginação normal
        const result = await query.range(pageParam, pageParam + CLIENTS_PER_PAGE - 1);
        leadsData = result.data;
        leadsError = result.error;
        count = result.count;
      }

      if (leadsError) throw leadsError;

      const transformedData: ClientData[] = (leadsData || []).map(lead => ({
        ...lead,
        tags: lead.lead_tags?.map((lt: any) => lt.tags).filter(Boolean) || []
      }));

      const hasMore = debouncedSearchQuery && debouncedSearchQuery.trim() 
        ? false 
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
    enabled: !!user?.id && !dataFilters.loading && !!dataFilters.role && !accessLoading && !hasActiveFilters,
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 10 * 60 * 1000
  });

  // ✅ MEMOIZAÇÃO - Clientes processados
  const processedClients = useMemo(() => {
    if (hasActiveFilters) {
      return filteredClientsData || [];
    }

    if (!clientsInfiniteQuery.data?.pages) return [];
    return clientsInfiniteQuery.data.pages.flatMap(page => page.data);
  }, [hasActiveFilters, filteredClientsData, clientsInfiniteQuery.data?.pages]);

  // ✅ CALLBACKS MEMOIZADOS
  const updateSearchQuery = useCallback((query: string) => {
    setClientsState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      companies: [],
      states: [],
      cities: [],
      countries: [],
      tags: [],
      responsibleUsers: [],
      funnelIds: [],
      funnelStages: []
    });
  }, []);

  const selectClient = useCallback((client: ClientData) => {
    setClientsState(prev => ({
      ...prev,
      selectedClient: client,
      isDetailsOpen: true,
      isCreateMode: false
    }));
  }, []);

  const toggleCreateMode = useCallback(() => {
    setClientsState(prev => ({
      ...prev,
      selectedClient: null,
      isDetailsOpen: true,
      isCreateMode: true
    }));
  }, []);

  const closeDetails = useCallback(() => {
    setClientsState(prev => ({
      ...prev,
      isDetailsOpen: false,
      selectedClient: null,
      isCreateMode: false
    }));
  }, []);

  const updateViewMode = useCallback((mode: 'table' | 'grid' | 'kanban') => {
    setClientsState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const updateSorting = useCallback((sortBy: 'name' | 'created_at' | 'purchase_value', sortOrder: 'asc' | 'desc') => {
    setClientsState(prev => ({ ...prev, sortBy, sortOrder }));
  }, []);

  // ✅ FUNÇÃO DE INVALIDAÇÃO ISOLADA
  const invalidateClientsData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: clientsQueryKeys.base });
  }, [queryClient]);

  return {
    // ✅ Dados isolados
    clients: processedClients,
    defaultWhatsAppInstance,
    filterOptions,
    
    // ✅ Estados isolados
    searchQuery: clientsState.searchQuery,
    selectedClient: clientsState.selectedClient,
    isDetailsOpen: clientsState.isDetailsOpen,
    isCreateMode: clientsState.isCreateMode,
    viewMode: clientsState.viewMode,
    sortBy: clientsState.sortBy,
    sortOrder: clientsState.sortOrder,
    filters,
    hasActiveFilters,
    
    // ✅ Loading states
    loading: clientsInfiniteQuery.isLoading || filteredClientsLoading || accessLoading || dataFilters.loading || filterOptionsLoading,
    isLoadingMore: clientsInfiniteQuery.isFetchingNextPage,
    
    // ✅ Paginação
    hasMoreClients: hasActiveFilters ? false : (clientsInfiniteQuery.data?.pages?.[clientsInfiniteQuery.data.pages.length - 1]?.hasMore ?? false),
    totalClientsCount: hasActiveFilters ? 
      (filteredClientsData?.length || 0) : 
      (clientsInfiniteQuery.data?.pages?.[0]?.totalCount || processedClients.length),
    
    // ✅ Actions isoladas
    updateSearchQuery,
    updateFilters,
    clearFilters,
    selectClient,
    toggleCreateMode,
    closeDetails,
    updateViewMode,
    updateSorting,
    loadMoreClients: clientsInfiniteQuery.fetchNextPage,
    
    // ✅ Metadata
    role: dataFilters.role,
    userId: user?.id,
    canViewAllFunnels,
    userFunnels,
    
    // ✅ Query client e invalidação
    queryClient,
    invalidateClientsData,
    refetch: hasActiveFilters ? refetchFilteredClients : clientsInfiniteQuery.refetch
  };
}