/**
 * 🎯 UNIFIED FUNNEL DATA MANAGER
 *
 * Este hook substitui múltiplos hooks duplicados:
 * - useFunnelLeads
 * - useStageInfiniteScroll
 * - useLeadsRealtime
 * - useSalesFunnelOptimized
 *
 * É o único responsável por carregar e gerenciar dados do funil.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KanbanLead, KanbanColumn } from '@/types/kanban';
import { SalesFunnelCoordinatorReturn } from '@/components/sales/core/SalesFunnelCoordinator';
import { funnelLeadsQueryKeys } from './leads/useFunnelLeads';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface FunnelDataOptions {
  funnelId?: string | null;
  enabled?: boolean;
  pageSize?: number;
  realtime?: boolean;
  coordinator?: SalesFunnelCoordinatorReturn; // Opcional para evitar dependência circular
}

interface FunnelDataReturn {
  // Dados principais
  columns: KanbanColumn[];
  allLeads: KanbanLead[];

  // Estados de carregamento
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;

  // Ações
  loadMore: () => void;
  refreshData: () => void;

  // Dados de scroll infinito por etapa
  getStageLeads: (stageId: string) => KanbanLead[];
  loadMoreForStage: (stageId: string) => void;

  // Estatísticas
  totalLeads: number;
  leadsPerStage: Record<string, number>;
}

/**
 * Hook unificado para gerenciar todos os dados do funil
 * Substitui múltiplos hooks que faziam funções similares
 */
export const useFunnelDataManager = (options: FunnelDataOptions): FunnelDataReturn => {
  const {
    funnelId,
    enabled = true,
    pageSize = 30,
    realtime = true,
    coordinator
  } = options;

  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const realtimeSubscription = useRef<any>(null);
  const stageLoadingState = useRef<Map<string, { page: number; hasMore: boolean }>>(new Map());

  // Estado local para dados organizados
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [allLeads, setAllLeads] = useState<KanbanLead[]>([]);

  // 🚀 BUSCAR ADMIN ID PARA OPERATIONAL (mesma lógica)
  const getLeadsOwnerId = useCallback(async (): Promise<string | null> => {
    if (!user?.id) return null;

    if (role === 'admin') {
      return user.id; // Admin vê seus próprios leads
    }

    if (role === 'operational') {
      // Buscar quem é o admin do operational
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('created_by_user_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('[useFunnelDataManager] Erro ao buscar admin do operational:', error);
        return null;
      }

      return profile?.created_by_user_id || null; // Retorna ID do admin
    }

    return null;
  }, [user?.id, role]);

  // Query principal para carregar etapas e leads iniciais
  const {
    data: funnelData,
    isLoading,
    refetch: refreshData
  } = useQuery({
    queryKey: funnelLeadsQueryKeys.byFunnel(funnelId || '', user?.id || '', role || ''),
    queryFn: async () => {
      if (!funnelId) return { stages: [], leads: [] };

      // 🚀 OBTER ID DO DONO DOS LEADS
      const leadsOwnerId = await getLeadsOwnerId();
      if (!leadsOwnerId) {
        console.error('[useFunnelDataManager] Não foi possível determinar dono dos leads');
        return { stages: [], leads: [] };
      }

      console.log('[useFunnelDataManager] 🎯 Buscando dados:', {
        funnelId,
        role,
        userId: user?.id,
        leadsOwnerId
      });

      // Carregando dados do funil

      // Carregar etapas - VERIFICANDO TABELA CORRETA
      // Carregar stages da tabela kanban_stages

      const { data: stages, error: stagesError } = await supabase
        .from('kanban_stages')
        .select('*')
        .eq('funnel_id', funnelId)
        .neq('is_won', true) // Excluir etapa GANHO da aba principal
        .neq('is_lost', true) // Excluir etapa PERDIDO da aba principal
        .order('order_position');

      // Stages carregadas

      if (stagesError) {
        console.error('[FunnelDataManager] ❌ Erro ao buscar stages:', stagesError);
        throw stagesError;
      }

      if (!stages || stages.length === 0) {
        console.warn('[FunnelDataManager] ⚠️ Nenhuma stage encontrada para o funil:', funnelId);
      }

      // Carregar leads iniciais - OTIMIZADO: 15 por etapa
      // Carregar apenas os primeiros leads de cada etapa para performance

      const leadsPromises = stages.map(async (stage: any) => {
        const { data: stageLeads, error } = await supabase
          .from('leads')
          .select(`
            *,
            lead_tags (
              tag_id,
              tags (
                id,
                name,
                color
              )
            )
          `)
          .eq('funnel_id', funnelId)
          .eq('created_by_user_id', leadsOwnerId) // 🚀 FILTRO CORRETO POR ROLES
          .eq('kanban_stage_id', stage.id)
          .order('created_at', { ascending: false })
          .limit(50); // 🚀 FASE 1: Aumentado de 15 → 50 leads por etapa inicialmente

        if (error) {
          console.error(`Erro ao carregar leads da etapa ${stage.id}:`, error);
          return [];
        }
        return stageLeads || [];
      });

      const leadsArrays = await Promise.all(leadsPromises);
      const leads = leadsArrays.flat();

      // Dados carregados com sucesso

      return { stages, leads };
    },
    enabled: enabled && !!funnelId && !roleLoading && !!role,
    staleTime: 5000, // ✅ CORREÇÃO: Cache reduzido para 5s - melhor tempo real
    gcTime: 600000 // 🚀 FASE 3: Manter em cache por 10 minutos
  });

  // Query infinita para carregamento sob demanda
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage: isLoadingMore
  } = useInfiniteQuery({
    queryKey: ['funnel-leads-infinite', funnelId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!funnelId) return { leads: [], nextPage: null };

      const { data: leads, error } = await supabase
        .from('leads')
        .select(`
          *,
          lead_tags (
            tag_id,
            tags (
              id,
              name,
              color
            )
          )
        `)
        .eq('funnel_id', funnelId)
        .order('created_at', { ascending: false })
        .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

      if (error) throw error;

      return {
        leads,
        nextPage: leads.length === pageSize ? pageParam + 1 : null
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: enabled && !!funnelId,
    initialPageParam: 0
  });

  // Organizar dados em colunas
  useEffect(() => {
    if (!funnelData) return;

    const { stages, leads } = funnelData;

    // Processar leads com mapeamento de tags (igual ao useFunnelLeads)
    const processedLeads: KanbanLead[] = leads.map(lead => {
      // Extrair e formatar tags
      const tags = lead.lead_tags?.map((lt: any) => {
        if (lt.tags) {
          return {
            id: lt.tags.id,
            name: lt.tags.name,
            color: lt.tags.color
          };
        }
        return null;
      }).filter((tag: any) => tag !== null) || [];

      // DEBUG: Verificar tags processadas
      if (tags.length > 0) {
        console.log('[FunnelDataManager] 🏷️ Lead com tags encontrado:', {
          leadName: lead.name,
          tagsCount: tags.length,
          tags
        });
      }

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
        tags, // ✅ TAGS PROCESSADAS!
        avatar: lead.profile_pic_url,
        last_message: lead.last_message,
        last_message_time: lead.last_message_time
      };
    });

    // Agrupar leads processados por etapa
    const leadsByStage = processedLeads.reduce((acc, lead) => {
      const stageId = lead.kanban_stage_id;
      if (!acc[stageId]) acc[stageId] = [];
      acc[stageId].push(lead);
      return acc;
    }, {} as Record<string, KanbanLead[]>);

    // Criar colunas organizadas - CORRIGIR MAPEAMENTO
    const newColumns: KanbanColumn[] = stages.map(stage => {
      // Verificar os campos reais que vêm do banco
      console.log('[FunnelDataManager] 🔍 Stage do banco:', {
        id: stage.id,
        name: stage.name,
        title: stage.title,
        allFields: Object.keys(stage)
      });

      return {
        id: stage.id,
        title: stage.title || stage.name || 'Sem nome', // Usar title OU name
        color: stage.color || '#6B7280',
        ai_enabled: stage.ai_enabled,
        leads: leadsByStage[stage.id] || [],
        order_position: stage.order_position
      };
    });

    setColumns(newColumns);
    setAllLeads(processedLeads);

    console.log('[FunnelDataManager] 🗂️ Dados organizados em colunas:', {
      colunas: newColumns.length,
      totalLeads: processedLeads.length,
      leadsByStageMap: Object.keys(leadsByStage).map(stageId => ({
        stageId,
        count: leadsByStage[stageId].length
      })),
      columnsDetail: newColumns.map(col => ({
        id: col.id,
        title: col.title,
        leadsCount: col.leads.length,
        color: col.color,
        order_position: col.order_position
      }))
    });
  }, [funnelData]);

  // Configurar realtime quando habilitado
  useEffect(() => {
    if (!realtime || !funnelId || !enabled) return;

    console.log('[FunnelDataManager] 🔴 Configurando realtime para funil:', funnelId);

    realtimeSubscription.current = supabase
      .channel(`funnel-${funnelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads',
        filter: `funnel_id=eq.${funnelId}`
      }, (payload) => {
        console.log('[FunnelDataManager] 📡 Atualização realtime leads:', payload);

        if (coordinator) {
          coordinator.emit({
            type: 'realtime:update',
            payload,
            priority: 'high',
            source: 'FunnelDataManager'
          });
        }

        // Refrescar dados quando há mudanças
        refreshData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'kanban_stages',
        filter: `funnel_id=eq.${funnelId}`
      }, (payload) => {
        console.log('[FunnelDataManager] 📡 Atualização realtime stages:', payload);

        if (coordinator) {
          coordinator.emit({
            type: 'realtime:update',
            payload,
            priority: 'high',
            source: 'FunnelDataManager'
          });
        }

        // Refrescar dados quando há mudanças em stages
        refreshData();
      })
      .subscribe();

    return () => {
      if (realtimeSubscription.current) {
        realtimeSubscription.current.unsubscribe();
      }
    };
  }, [realtime, funnelId, enabled, refreshData]);

  // Escutar eventos do coordinator para atualizações otimistas
  useEffect(() => {
    if (!coordinator) return;

    const handleCoordinatorEvent = (event: any) => {
      console.log('[FunnelDataManager] 📡 Evento coordinator recebido:', event);

      if (event.type === 'realtime:update' && event.payload?.table === 'kanban_stages') {
        console.log('[FunnelDataManager] 🔄 Atualização otimista de stage:', event.payload);

        // Atualizar coluna específica sem refetch completo
        const { new: newStage } = event.payload;
        if (newStage && newStage.id) {
          console.log('[FunnelDataManager] ✅ Aplicando update otimista:', {
            stageId: newStage.id,
            oldValue: columns.find(c => c.id === newStage.id)?.ai_enabled,
            newValue: newStage.ai_enabled
          });

          setColumns(prevColumns =>
            prevColumns.map(col =>
              col.id === newStage.id
                ? {
                    ...col,
                    ai_enabled: newStage.ai_enabled,
                    title: newStage.title || newStage.name || col.title
                  }
                : col
            )
          );
        }
      }
    };

    // Usar sistema de subscription do coordinator
    const unsubscribe = coordinator.subscribe('realtime:update', handleCoordinatorEvent);
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [coordinator, columns]);

  // Carregar mais dados (scroll infinito geral)
  const loadMore = useCallback(() => {
    if (hasNextPage && !isLoadingMore) {
      console.log('[FunnelDataManager] 📜 Carregando mais dados...');

      if (coordinator) {
        coordinator.emit({
          type: 'scroll:load-more',
          payload: { type: 'general' },
          priority: 'normal',
          source: 'FunnelDataManager'
        });
      }

      fetchNextPage();
    }
  }, [hasNextPage, isLoadingMore, fetchNextPage, coordinator]);

  // Carregar mais dados para etapa específica
  const loadMoreForStage = useCallback(async (stageId: string) => {
    const stageState = stageLoadingState.current.get(stageId) || { page: 0, hasMore: true };

    if (!stageState.hasMore) return;

    console.log('[FunnelDataManager] 📜 🚀 FASE 2: Carregando mais leads do banco para etapa:', stageId);

    try {
      // 🚀 FASE 2: Query otimizada para carregar do banco com filtros de segurança
      const { data: moreLeads, error } = await supabase
        .from('leads')
        .select(`
          *,
          lead_tags (
            tag_id,
            tags (
              id,
              name,
              color
            )
          )
        `)
        .eq('kanban_stage_id', stageId)
        .eq('funnel_id', funnelId) // 🔒 Filtro adicional de segurança
        .order('created_at', { ascending: false })
        .range(stageState.page * pageSize, (stageState.page + 1) * pageSize - 1);

      if (error) throw error;

      // Atualizar estado da etapa
      stageLoadingState.current.set(stageId, {
        page: stageState.page + 1,
        hasMore: moreLeads.length === pageSize
      });

      // Adicionar leads à coluna correspondente
      setColumns(prev => prev.map(column => {
        if (column.id === stageId) {
          return {
            ...column,
            leads: [...column.leads, ...moreLeads]
          };
        }
        return column;
      }));

      console.log('[FunnelDataManager] ✅ Mais leads carregados para etapa:', {
        stageId,
        novosLeads: moreLeads.length
      });

    } catch (error) {
      console.error('[FunnelDataManager] ❌ Erro ao carregar mais para etapa:', error);
    }
  }, [pageSize]);

  // Obter leads de uma etapa específica
  const getStageLeads = useCallback((stageId: string): KanbanLead[] => {
    const column = columns.find(col => col.id === stageId);
    return column?.leads || [];
  }, [columns]);

  // Calcular estatísticas
  const totalLeads = allLeads.length;
  const leadsPerStage = columns.reduce((acc, column) => {
    acc[column.id] = column.leads.length;
    return acc;
  }, {} as Record<string, number>);

  return {
    // Dados principais
    columns,
    allLeads,

    // Estados de carregamento
    isLoading,
    isLoadingMore,
    hasNextPage: hasNextPage || false,

    // Ações
    loadMore,
    refreshData,

    // Dados de scroll infinito por etapa
    getStageLeads,
    loadMoreForStage,

    // Estatísticas
    totalLeads,
    leadsPerStage
  };
};