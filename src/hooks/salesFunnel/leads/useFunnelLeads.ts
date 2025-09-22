/**
 * 🎯 HOOK ISOLADO - BUSCAR LEADS COM TAGS
 *
 * RESPONSABILIDADES:
 * ✅ Buscar leads do funil COM tags já incluídas
 * ✅ Paginação para performance
 * ✅ Cache otimizado com React Query
 * ✅ Formatação das tags para uso direto
 *
 * NÃO FAZ:
 * ❌ Real-time (isso é no useLeadsRealtime)
 * ❌ Ações (isso é no useLeadActions)
 * ❌ Gerenciamento de tags (isso é no useLeadTags)
 */

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KanbanLead, KanbanTag } from '@/types/kanban';
import { useAuth } from '@/contexts/AuthContext';

// Query keys isoladas para leads
export const funnelLeadsQueryKeys = {
  all: ['salesfunnel-leads'] as const,
  byFunnel: (funnelId: string, userId: string) =>
    [...funnelLeadsQueryKeys.all, 'funnel', funnelId, 'user', userId] as const,
  byStage: (funnelId: string, stageId: string) =>
    [...funnelLeadsQueryKeys.all, 'funnel', funnelId, 'stage', stageId] as const,
};

interface UseFunnelLeadsParams {
  funnelId: string | null;
  enabled?: boolean;
  pageSize?: number; // Tamanho da página para scroll infinito
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

export function useFunnelLeads({
  funnelId,
  enabled = true,
  pageSize = 20 // Scroll infinito com 20 leads por vez - mais leve
}: UseFunnelLeadsParams) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryResult = useInfiniteQuery({
    queryKey: funnelLeadsQueryKeys.byFunnel(funnelId || '', user?.id || ''),
    queryFn: async ({ pageParam = 0 }) => {
      if (!funnelId || !user?.id) {
        return { leads: [], nextPage: null, totalCount: 0 };
      }

      try {
        let data, error, count;

        if (pageParam === 0) {
          // PRIMEIRA PÁGINA: Buscar 15 leads de cada etapa para distribuição equilibrada

          // Primeiro, buscar todas as etapas do funil (excluir GANHO e PERDIDO)
          const { data: stages } = await supabase
            .from('kanban_stages')
            .select('id')
            .eq('funnel_id', funnelId)
            .neq('is_won', true)  // Excluir etapa GANHO da aba principal
            .neq('is_lost', true); // Excluir etapa PERDIDO da aba principal

          if (stages && stages.length > 0) {
            // Buscar 15 leads de cada etapa em paralelo
            const stageQueries = stages.map(stage =>
              supabase
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
                `)
                .eq('funnel_id', funnelId)
                .eq('created_by_user_id', user.id)
                .eq('kanban_stage_id', stage.id)
                .not('state', 'in', '("won","lost")') // Excluir leads ganhos e perdidos do funil principal
                .in('conversation_status', ['active', 'closed', null])
                .order('updated_at', { ascending: false })
                .limit(15)
            );

            const results = await Promise.all(stageQueries);

            // Combinar todos os leads de todas as etapas
            data = results.flatMap(result => result.data || []);
            error = results.find(result => result.error)?.error || null;
            count = data.length;

            // Log condicional para debugging apenas quando necessário
            if (process.env.NODE_ENV === 'development' && data.length > 0) {
              console.log('[useFunnelLeads] ✅ Leads distribuídos:', {
                etapas: stages.length,
                totalLeads: data.length
              });
            }
          } else {
            // Fallback se não encontrar etapas
            const result = await supabase
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
              .eq('created_by_user_id', user.id)
              .not('state', 'in', '("won","lost")') // Excluir leads ganhos e perdidos do funil principal
              .in('conversation_status', ['active', 'closed', null])
              .order('updated_at', { ascending: false })
              .limit(50);

            data = result.data;
            error = result.error;
            count = result.count;
          }
        } else {
          // PÁGINAS SEGUINTES: Scroll infinito normal com 20 leads

          const result = await supabase
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
            .eq('created_by_user_id', user.id)
            .not('state', 'in', '("won","lost")') // Excluir leads ganhos e perdidos do funil principal
            .in('conversation_status', ['active', 'closed', null])
            .order('updated_at', { ascending: false })
            .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

          data = result.data;
          error = result.error;
          count = result.count;
        }

        if (error) {
          console.error('[useFunnelLeads] ❌ Erro ao buscar leads:', error);
          throw error;
        }

        const totalCount = count || 0;
        // Para primeira página, sempre permitir mais páginas se temos dados
        const hasMore = pageParam === 0
          ? (data?.length || 0) > 0 && totalCount > data?.length
          : ((pageParam + 1) * pageSize) < totalCount;

        // Log removido - evitar loops no render

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

          // Tags já processadas

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
            purchase_value: lead.purchase_value, // Manter ambos por compatibilidade
            unreadCount: lead.unread_count || 0,
            unread_count: lead.unread_count || 0, // Manter ambos por compatibilidade
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
            tags, // ✅ TAGS AGORA INCLUÍDAS!
            avatar: lead.profile_pic_url,
            last_message: lead.last_message,
            last_message_time: lead.last_message_time
          };
        });

        // Log removido - evitar loops no render

        return {
          leads: formattedLeads,
          nextPage: hasMore ? pageParam + 1 : null,
          totalCount
        };
      } catch (error) {
        console.error('[useFunnelLeads] ❌ Erro crítico:', error);
        return { leads: [], nextPage: null, totalCount: 0 };
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: Boolean(funnelId && user?.id && enabled),
    staleTime: 0, // Sempre considerar dados como stale para garantir atualização
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true, // ✅ HABILITADO - refetch ao focar para resolver problema inicial
    refetchOnReconnect: true, // ✅ HABILITADO - refetch ao reconectar
    refetchOnMount: true // ✅ SEMPRE refetch ao montar componente
  });

  // Achatar todas as páginas em uma única lista de leads
  const allLeads = queryResult.data?.pages.flatMap(page => page.leads) || [];

  // Scroll infinito controlado manualmente - sem auto-load

  // Função para carregar mais leads (scroll infinito manual)
  const loadMore = () => {
    if (queryResult.hasNextPage && !queryResult.isFetchingNextPage) {
      queryResult.fetchNextPage();
    }
  };

  // Função para atualizar um lead específico (usado pelo real-time)
  const updateLead = (leadId: string, updates: Partial<KanbanLead>) => {
    queryClient.setQueryData(
      funnelLeadsQueryKeys.byFunnel(funnelId || '', user?.id || ''),
      (oldData: any) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            leads: page.leads.map((lead: KanbanLead) =>
              lead.id === leadId ? { ...lead, ...updates } : lead
            )
          }))
        };
      }
    );
  };

  // Função para adicionar novo lead (quando chegar em "Entrada de Leads")
  const addNewLead = (newLead: KanbanLead) => {
    queryClient.setQueryData(
      funnelLeadsQueryKeys.byFunnel(funnelId || '', user?.id || ''),
      (oldData: any) => {
        if (!oldData?.pages?.length) {
          return {
            pages: [{ leads: [newLead], nextPage: null, totalCount: 1 }],
            pageParams: [0]
          };
        }

        return {
          ...oldData,
          pages: [
            {
              ...oldData.pages[0],
              leads: [newLead, ...oldData.pages[0].leads]
            },
            ...oldData.pages.slice(1)
          ]
        };
      }
    );
  };

  // Função para remover lead
  const removeLead = (leadId: string) => {
    queryClient.setQueryData(
      funnelLeadsQueryKeys.byFunnel(funnelId || '', user?.id || ''),
      (oldData: any) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            leads: page.leads.filter((lead: KanbanLead) => lead.id !== leadId)
          }))
        };
      }
    );
  };

  return {
    leads: allLeads,
    isLoading: queryResult.isLoading,
    isFetchingNextPage: queryResult.isFetchingNextPage,
    hasNextPage: queryResult.hasNextPage,
    error: queryResult.error,
    refetch: queryResult.refetch,
    loadMore,
    updateLead,
    addNewLead,
    removeLead,
    totalCount: queryResult.data?.pages[0]?.totalCount || 0
  };
}