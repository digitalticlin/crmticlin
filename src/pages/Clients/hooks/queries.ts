/**
 * 🔒 QUERIES ISOLADAS - PÁGINA CLIENTS
 * Todas as queries com proteção multi-tenant obrigatória
 * CRÍTICO: Sempre filtrar por created_by_user_id
 */

import { useQuery, useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientsPageFilters, validateClientAccess } from "./datafilters";
import { ClientData } from "../types";

const CLIENTS_PER_PAGE = 50;
const SEARCH_LIMIT = 500;

/**
 * 🔒 QUERY PRINCIPAL - Lista de Clientes com Multi-tenant
 */
export const useClientsPageQuery = (searchQuery: string = "") => {
  const filters = useClientsPageFilters();
  
  return useInfiniteQuery({
    queryKey: ["clients-page", filters.userId, filters.role, filters.createdByUserId, searchQuery],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }): Promise<{
      data: ClientData[];
      nextCursor: number | undefined;
      hasMore: boolean;
      totalCount: number;
    }> => {
      // Validação de segurança
      if (!filters.userId || filters.loading || !filters.role) {
        console.log('[Clients Query] ⚠️ Bloqueado: usuário não autenticado');
        return { data: [], nextCursor: undefined, hasMore: false, totalCount: 0 };
      }
      
      console.log('[Clients Query] 🔒 Iniciando query com proteção multi-tenant:', {
        userId: filters.userId,
        role: filters.role,
        createdByUserId: filters.createdByUserId,
        ownerFilter: filters.ownerFilter
      });
      
      // Base query com seleção completa
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

      // 🔒 APLICAR FILTRO MULTI-TENANT OBRIGATÓRIO
      if (filters.role === 'admin' && filters.createdByUserId) {
        // Admin: SEMPRE filtrar por created_by_user_id
        query = query.eq("created_by_user_id", filters.createdByUserId);
        console.log('[Clients Query] 👑 ADMIN - Filtro multi-tenant aplicado:', filters.createdByUserId);
        
      } else if (filters.role === 'operational') {
        // Operacional: filtrar por owner_id ou whatsapp_instances
        if (filters.ownerFilter) {
          query = query.eq("owner_id", filters.ownerFilter);
          console.log('[Clients Query] 🎯 OPERACIONAL - Filtro por owner_id:', filters.ownerFilter);
        } else if (filters.whatsappInstancesFilter && filters.whatsappInstancesFilter.length > 0) {
          query = query.in("whatsapp_number_id", filters.whatsappInstancesFilter);
          console.log('[Clients Query] 🎯 OPERACIONAL - Filtro por instâncias:', filters.whatsappInstancesFilter);
        } else {
          // Operacional sem atribuições: não retorna nada
          console.warn('[Clients Query] ⚠️ OPERACIONAL sem atribuições - bloqueando acesso');
          return { data: [], nextCursor: undefined, hasMore: false, totalCount: 0 };
        }
      } else {
        // Usuário padrão ou role indefinido: bloquear por segurança
        console.warn('[Clients Query] ⚠️ Role não reconhecido - bloqueando acesso');
        return { data: [], nextCursor: undefined, hasMore: false, totalCount: 0 };
      }

      // Aplicar busca se houver
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim();
        const ilike = `%${q}%`;
        query = query.or(
          `name.ilike.${ilike},phone.ilike.${ilike},email.ilike.${ilike},company.ilike.${ilike}`
        );
      }

      // Executar query com paginação ou busca
      let result;
      if (searchQuery && searchQuery.trim()) {
        // Modo busca: limite de segurança
        result = await query.limit(SEARCH_LIMIT);
        console.log('[Clients Query] 🔍 Modo busca ativado (limite: 500)');
      } else {
        // Modo paginação normal
        result = await query.range(pageParam, pageParam + CLIENTS_PER_PAGE - 1);
        console.log('[Clients Query] 📄 Paginação:', { offset: pageParam, limit: CLIENTS_PER_PAGE });
      }

      if (result.error) {
        console.error('[Clients Query] ❌ Erro:', result.error);
        throw result.error;
      }

      // Transformar e validar dados
      const transformedData: ClientData[] = (result.data || []).map(lead => {
        // Validação adicional de segurança
        if (!validateClientAccess(lead, filters)) {
          console.warn('[Clients Query] ⚠️ Registro bloqueado por validação:', lead.id);
          return null;
        }
        
        return {
          ...lead,
          tags: lead.lead_tags?.map((lt: any) => lt.tags).filter(Boolean) || []
        };
      }).filter(Boolean) as ClientData[];

      console.log('[Clients Query] ✅ Dados carregados com segurança:', {
        total: transformedData.length,
        pageParam,
        hasMore: transformedData.length === CLIENTS_PER_PAGE
      });

      // Determinar paginação
      const hasMore = searchQuery ? false : transformedData.length === CLIENTS_PER_PAGE;
      const nextCursor = hasMore ? pageParam + CLIENTS_PER_PAGE : undefined;

      return {
        data: transformedData,
        nextCursor,
        hasMore,
        totalCount: result.count || 0
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!filters.userId && !filters.loading && !!filters.role,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15, // 15 minutos
  });
};

/**
 * 🔒 QUERY DE FILTROS - Opções disponíveis com Multi-tenant
 */
export const useClientsFilterOptions = () => {
  const filters = useClientsPageFilters();
  
  return useQuery({
    queryKey: ["clients-filter-options", filters.userId, filters.role, filters.createdByUserId],
    queryFn: async () => {
      if (!filters.userId || filters.loading || !filters.role) return null;

      console.log('[Filter Options] 🔒 Buscando opções com multi-tenant');

      // Queries base com filtro multi-tenant
      let tagQuery = supabase.from("tags").select("id, name, color").order("name");
      let userQuery = supabase.from("profiles").select("id, full_name").order("full_name");
      let funnelQuery = supabase.from("funnels").select("id, name").order("name");
      let stagesQuery = supabase.from("kanban_stages").select("id, title").order("order_position");

      // 🔒 APLICAR FILTROS MULTI-TENANT
      if (filters.role === 'admin' && filters.createdByUserId) {
        tagQuery = tagQuery.eq("created_by_user_id", filters.createdByUserId);
        funnelQuery = funnelQuery.eq("created_by_user_id", filters.createdByUserId);
        stagesQuery = stagesQuery.eq("created_by_user_id", filters.createdByUserId);
        console.log('[Filter Options] 👑 ADMIN - Filtros multi-tenant aplicados');
      }

      // Buscar dados
      const [tags, users, funnels, stages] = await Promise.all([
        tagQuery,
        userQuery,
        funnelQuery,
        stagesQuery
      ]);

      // Buscar valores únicos dos leads (com filtro multi-tenant)
      let leadsQuery = supabase.from("leads");
      
      if (filters.role === 'admin' && filters.createdByUserId) {
        leadsQuery = leadsQuery.eq("created_by_user_id", filters.createdByUserId);
      } else if (filters.role === 'operational') {
        if (filters.ownerFilter) {
          leadsQuery = leadsQuery.eq("owner_id", filters.ownerFilter);
        } else if (filters.whatsappInstancesFilter) {
          leadsQuery = leadsQuery.in("whatsapp_number_id", filters.whatsappInstancesFilter);
        }
      }

      const [states, cities, countries, companies] = await Promise.all([
        leadsQuery.select("state").not("state", "is", null),
        leadsQuery.select("city").not("city", "is", null),
        leadsQuery.select("country").not("country", "is", null),
        leadsQuery.select("company").not("company", "is", null)
      ]);

      return {
        tags: tags.data || [],
        companies: [...new Set((companies.data || []).map(c => c.company).filter(Boolean))],
        responsibleUsers: (users.data || []).map(u => ({ id: u.id, name: u.full_name })),
        funnelIds: funnels.data || [],
        funnelStages: stages.data || [],
        states: [...new Set((states.data || []).map(s => s.state).filter(Boolean))],
        cities: [...new Set((cities.data || []).map(c => c.city).filter(Boolean))],
        countries: [...new Set((countries.data || []).map(c => c.country).filter(Boolean))]
      };
    },
    enabled: !!filters.userId && !filters.loading && !!filters.role,
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
  });
};

/**
 * 🔒 QUERY DE CLIENTE INDIVIDUAL - Com validação multi-tenant
 */
export const useClientByIdQuery = (clientId: string | null) => {
  const filters = useClientsPageFilters();
  
  return useQuery({
    queryKey: ["client-by-id", clientId, filters.userId, filters.role],
    queryFn: async (): Promise<ClientData | null> => {
      if (!clientId || !filters.userId || !filters.role) return null;
      
      const { data, error } = await supabase
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
        .eq("id", clientId)
        .single();
      
      if (error) {
        console.error('[Client Query] Erro ao buscar cliente:', error);
        return null;
      }
      
      // 🔒 VALIDAÇÃO MULTI-TENANT
      if (!validateClientAccess(data, filters)) {
        console.warn('[Client Query] ⚠️ Acesso negado ao cliente:', clientId);
        return null;
      }
      
      return {
        ...data,
        tags: data.lead_tags?.map((lt: any) => lt.tags).filter(Boolean) || []
      };
    },
    enabled: !!clientId && !!filters.userId && !filters.loading && !!filters.role,
  });
};

/**
 * 🔒 MUTATION - Criar Cliente com Multi-tenant
 */
export const useCreateClientMutation = () => {
  const filters = useClientsPageFilters();
  
  return useMutation({
    mutationFn: async (newClient: Partial<ClientData>) => {
      if (!filters.userId || !filters.createdByUserId) {
        throw new Error("Usuário não autenticado");
      }
      
      // 🔒 FORÇAR created_by_user_id
      const clientWithUserId = {
        ...newClient,
        created_by_user_id: filters.createdByUserId,
        owner_id: newClient.owner_id || filters.userId
      };
      
      const { data, error } = await supabase
        .from("leads")
        .insert(clientWithUserId)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('[Create Client] ✅ Cliente criado com multi-tenant:', data.id);
      return data;
    }
  });
};

/**
 * 🔒 MUTATION - Atualizar Cliente com validação multi-tenant
 */
export const useUpdateClientMutation = () => {
  const filters = useClientsPageFilters();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ClientData> }) => {
      if (!filters.userId || !filters.role) {
        throw new Error("Usuário não autenticado");
      }
      
      // Primeiro verificar se tem acesso ao cliente
      const { data: existingClient } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id)
        .single();
      
      if (!existingClient || !validateClientAccess(existingClient, filters)) {
        throw new Error("Acesso negado ao cliente");
      }
      
      // 🔒 NUNCA permitir alterar created_by_user_id
      const { created_by_user_id, ...safeUpdates } = updates;
      
      const { data, error } = await supabase
        .from("leads")
        .update(safeUpdates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('[Update Client] ✅ Cliente atualizado com segurança:', id);
      return data;
    }
  });
};

/**
 * 🔒 MUTATION - Deletar Cliente com validação multi-tenant
 */
export const useDeleteClientMutation = () => {
  const filters = useClientsPageFilters();
  
  return useMutation({
    mutationFn: async (clientId: string) => {
      if (!filters.userId || !filters.role) {
        throw new Error("Usuário não autenticado");
      }
      
      // Verificar acesso antes de deletar
      const { data: existingClient } = await supabase
        .from("leads")
        .select("*")
        .eq("id", clientId)
        .single();
      
      if (!existingClient || !validateClientAccess(existingClient, filters)) {
        throw new Error("Acesso negado ao cliente");
      }
      
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", clientId);
      
      if (error) throw error;
      
      console.log('[Delete Client] ✅ Cliente deletado com segurança:', clientId);
      return clientId;
    }
  });
};