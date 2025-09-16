/**
 * 🎯 HOOK ISOLADO - SCROLL INFINITO POR ETAPA
 *
 * RESPONSABILIDADES:
 * ✅ Scroll infinito específico para uma etapa
 * ✅ Paginação otimizada por etapa
 * ✅ Cache independente por etapa
 * ✅ Performance controlada
 *
 * NÃO FAZ:
 * ❌ Gerenciamento global de leads (isso é no useFunnelLeads)
 * ❌ Real-time (isso é no useLeadsRealtime)
 * ❌ Ações de leads (isso é no useLeadActions)
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KanbanLead, KanbanTag } from '@/types/kanban';
import { useAuth } from '@/contexts/AuthContext';

// Query keys isoladas para scroll infinito por etapa
export const stageInfiniteScrollQueryKeys = {
  all: ['stage-infinite-scroll'] as const,
  byStage: (stageId: string, funnelId: string, userId: string) =>
    [...stageInfiniteScrollQueryKeys.all, 'stage', stageId, 'funnel', funnelId, 'user', userId] as const,
};

interface UseStageInfiniteScrollParams {
  stageId: string | null;
  funnelId: string | null;
  enabled?: boolean;
  pageSize?: number; // Leads por página
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

export function useStageInfiniteScroll({
  stageId,
  funnelId,
  enabled = true,
  pageSize = 20 // 20 leads por página - otimizado para scroll infinito
}: UseStageInfiniteScrollParams) {
  const { user } = useAuth();

  const queryResult = useInfiniteQuery({
    queryKey: stageInfiniteScrollQueryKeys.byStage(stageId || '', funnelId || '', user?.id || ''),
    queryFn: async ({ pageParam = 0 }) => {
      if (!stageId || !funnelId || !user?.id) {
        console.log('[useStageInfiniteScroll] ❌ Parâmetros inválidos:', { stageId, funnelId, userId: user?.id });
        return { leads: [], nextPage: null, totalCount: 0 };
      }

      console.log('[useStageInfiniteScroll] 🔍 Buscando página:', {
        stageId,
        pageParam,
        pageSize
      });

      try {
        // Buscar leads desta etapa específica com paginação
        const { data, error, count } = await supabase
          .from('leads')
          .select(`
            id, name, phone, email, company, notes,
            last_message, last_message_time, purchase_value,
            unread_count, owner_id, created_by_user_id,
            kanban_stage_id, funnel_id, whatsapp_number_id,
            created_at, updated_at, profile_pic_url, conversation_status,
            lead_tags (
              tag_id,
              tags (id, name, color)
            )
          `, { count: 'exact' })
          .eq('funnel_id', funnelId)
          .eq('kanban_stage_id', stageId)
          .eq('created_by_user_id', user.id)
          .in('conversation_status', ['active', 'closed', null])
          .order('updated_at', { ascending: false })
          .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

        if (error) {
          console.error('[useStageInfiniteScroll] ❌ Erro ao buscar leads:', error);
          throw error;
        }

        const totalCount = count || 0;
        const hasMore = ((pageParam + 1) * pageSize) < totalCount;

        console.log('[useStageInfiniteScroll] ✅ Página carregada:', {
          pageParam,
          leadsRetornados: data?.length || 0,
          totalCount,
          hasMore
        });

        // Formatar leads com tags processadas
        const formattedLeads: KanbanLead[] = (data as LeadWithTags[] || []).map(lead => {
          // Extrair e formatar tags
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
        console.error('[useStageInfiniteScroll] ❌ Erro crítico:', error);
        return { leads: [], nextPage: null, totalCount: 0 };
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!stageId && !!funnelId && !!user?.id && enabled,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });

  // Achatar todas as páginas em uma única lista de leads
  const allLeads = queryResult.data?.pages.flatMap(page => page.leads) || [];

  // Função para carregar mais leads
  const loadMore = () => {
    if (queryResult.hasNextPage && !queryResult.isFetchingNextPage) {
      console.log('[useStageInfiniteScroll] 📜 Carregando próxima página...');
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