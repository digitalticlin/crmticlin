/**
 * 🎯 HOOK FILTRADO - BUSCAR LEADS COM FILTROS NO SERVIDOR
 *
 * RESPONSABILIDADES:
 * ✅ Buscar leads com filtros aplicados no banco
 * ✅ Suportar busca por texto, tags e responsável
 * ✅ Paginação para performance
 * ✅ Cache otimizado com React Query
 */

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KanbanLead, KanbanTag } from '@/types/kanban';
import { useAuth } from '@/contexts/AuthContext';

// Query keys isoladas para leads filtrados
export const funnelLeadsFilteredQueryKeys = {
  all: ['salesfunnel-leads-filtered'] as const,
  withFilters: (
    funnelId: string,
    userId: string,
    searchTerm: string,
    selectedTags: string[],
    selectedUser: string
  ) => [...funnelLeadsFilteredQueryKeys.all, 'funnel', funnelId, 'user', userId, 'search', searchTerm, 'tags', selectedTags, 'assignedUser', selectedUser] as const,
};

interface UseFunnelLeadsFilteredParams {
  funnelId: string | null;
  searchTerm?: string;
  selectedTags?: string[];
  selectedUser?: string;
  enabled?: boolean;
  pageSize?: number;
}

interface LeadWithTags {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  notes?: string;
  last_message?: string;
  last_message_time?: string;
  purchase_value?: number;
  unread_count?: number;
  owner_id?: string;
  created_by_user_id: string;
  kanban_stage_id?: string;
  funnel_id: string;
  whatsapp_number_id?: string;
  created_at: string;
  updated_at?: string;
  profile_pic_url?: string;
  conversation_status?: string;
  lead_tags?: {
    tag_id: string;
    tags: {
      id: string;
      name: string;
      color: string;
    } | null;
  }[];
}

export function useFunnelLeadsFiltered({
  funnelId,
  searchTerm = '',
  selectedTags = [],
  selectedUser = '',
  enabled = true,
  pageSize = 50 // Maior para busca filtrada
}: UseFunnelLeadsFilteredParams) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryResult = useInfiniteQuery({
    queryKey: funnelLeadsFilteredQueryKeys.withFilters(
      funnelId || '',
      user?.id || '',
      searchTerm,
      selectedTags,
      selectedUser
    ),
    queryFn: async ({ pageParam = 0 }) => {
      if (!funnelId || !user?.id) {
        return { leads: [], nextPage: null, totalCount: 0 };
      }

      // Log condicional para debugging apenas quando necessário
      if (process.env.NODE_ENV === 'development' && pageParam === 0) {
        console.log('[useFunnelLeadsFiltered] 🔍 FILTROS NO SERVIDOR:', {
          funnelId,
          hasSearchTerm: !!searchTerm,
          hasSelectedTags: selectedTags.length > 0,
          hasSelectedUser: !!selectedUser
        });
      }

      try {
        // Query base com joins
        let query = supabase
          .from('leads')
          .select(`
            id, name, phone, email, company, notes,
            last_message, last_message_time, purchase_value,
            unread_count, owner_id, created_by_user_id,
            kanban_stage_id, funnel_id, whatsapp_number_id,
            created_at, updated_at, profile_pic_url, conversation_status,
            lead_tags!left (
              tag_id,
              tags (id, name, color)
            )
          `, { count: 'exact' })
          .eq('funnel_id', funnelId)
          .eq('created_by_user_id', user.id)
          .in('conversation_status', ['active', 'closed', null]);

        // FILTRO DE BUSCA POR TEXTO
        if (searchTerm && searchTerm.trim()) {
          const searchLower = searchTerm.toLowerCase();
          const searchTrimmed = searchLower.trim();

          // Verificar se é uma busca numérica (apenas números)
          const isNumericSearch = /^\d+$/.test(searchTrimmed);

          if (isNumericSearch) {
            // Para busca numérica, procurar EXATAMENTE a sequência
            const phoneFilter = `phone.ilike.${searchTrimmed}%,phone.ilike.%${searchTrimmed}%,name.ilike.%${searchLower}%`;
            query = query.or(phoneFilter);
          } else {
            // Para busca de texto, manter comportamento normal
            const textFilter = `name.ilike.%${searchLower}%,email.ilike.%${searchLower}%,company.ilike.%${searchLower}%,notes.ilike.%${searchLower}%`;
            query = query.or(textFilter);
          }
        }

        // FILTRO POR RESPONSÁVEL
        if (selectedUser) {
          query = query.eq('owner_id', selectedUser);
        }

        // Ordenação e paginação
        query = query
          .order('updated_at', { ascending: false })
          .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

        const { data, error, count } = await query;

        if (error) {
          console.error('[useFunnelLeadsFiltered] ❌ Erro na query:', error);
          throw error;
        }

        let filteredLeads = data as LeadWithTags[] || [];

        // FILTRO POR TAGS (pós-query devido à estrutura do banco)
        if (selectedTags.length > 0) {
          const originalCount = filteredLeads.length;
          filteredLeads = filteredLeads.filter(lead => {
            const leadTagIds = lead.lead_tags?.map(lt => lt.tag_id) || [];
            return selectedTags.some(tagId => leadTagIds.includes(tagId));
          });
        }

        const totalCount = selectedTags.length > 0 ? filteredLeads.length : (count || 0);
        const hasMore = ((pageParam + 1) * pageSize) < totalCount;

        // Log de resultados apenas na primeira página e quando há filtros
        if (process.env.NODE_ENV === 'development' && pageParam === 0 && (searchTerm || selectedTags.length > 0 || selectedUser)) {
          console.log('[useFunnelLeadsFiltered] ✅ Resultados:', {
            resultados: filteredLeads.length,
            totalCount,
            hasFilters: true
          });
        }

        // Formatar leads com tags
        const formattedLeads: KanbanLead[] = filteredLeads.map(lead => {
          const tags: KanbanTag[] = lead.lead_tags?.map(lt => {
            if (lt.tags) {
              return {
                id: lt.tags.id,
                name: lt.tags.name,
                color: lt.tags.color
              };
            }
            return null;
          }).filter((tag): tag is KanbanTag => tag !== null) || [];

          return {
            id: lead.id,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            company: lead.company,
            notes: lead.notes,
            lastMessage: lead.last_message || 'Sem mensagens',
            lastMessageTime: lead.last_message_time || new Date().toISOString(),
            purchaseValue: lead.purchase_value,
            purchase_value: lead.purchase_value,
            unreadCount: lead.unread_count || 0,
            unread_count: lead.unread_count || 0,
            assignedUser: lead.owner_id,
            owner_id: lead.owner_id,
            created_by_user_id: lead.created_by_user_id,
            columnId: lead.kanban_stage_id || '',
            kanban_stage_id: lead.kanban_stage_id,
            funnel_id: lead.funnel_id,
            whatsapp_number_id: lead.whatsapp_number_id,
            created_at: lead.created_at,
            updated_at: lead.updated_at,
            profile_pic_url: lead.profile_pic_url,
            conversation_status: lead.conversation_status,
            tags,
            avatar: lead.profile_pic_url,
            last_message: lead.last_message,
            last_message_time: lead.last_message_time
          };
        });

        return {
          leads: formattedLeads,
          nextPage: hasMore ? pageParam + 1 : null,
          totalCount
        };
      } catch (error) {
        console.error('[useFunnelLeadsFiltered] ❌ Erro crítico:', error);
        return { leads: [], nextPage: null, totalCount: 0 };
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: Boolean(funnelId && user?.id && enabled),
    staleTime: 30 * 1000, // 30 segundos para filtros
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false, // Evitar refetch desnecessário
    refetchOnReconnect: false,
    refetchOnMount: 'always' // Sempre refetch ao montar com novos filtros
  });

  // Achatar todas as páginas em uma única lista
  const allLeads = queryResult.data?.pages.flatMap(page => page.leads) || [];

  // Função para carregar mais
  const loadMore = () => {
    if (queryResult.hasNextPage && !queryResult.isFetchingNextPage) {
      queryResult.fetchNextPage();
    }
  };

  return {
    leads: allLeads,
    isLoading: queryResult.isLoading,
    isFetchingNextPage: queryResult.isFetchingNextPage,
    hasNextPage: queryResult.hasNextPage,
    error: queryResult.error,
    refetch: queryResult.refetch,
    loadMore,
    totalCount: queryResult.data?.pages[0]?.totalCount || 0
  };
}