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
// import { useSalesFunnelCoordinator } from '@/components/sales/core/SalesFunnelCoordinator'; // Removido para evitar dependência circular
import { funnelLeadsQueryKeys } from './leads/useFunnelLeads';

interface FunnelDataOptions {
  funnelId?: string | null;
  enabled?: boolean;
  pageSize?: number;
  realtime?: boolean;
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
    realtime = true
  } = options;

  // const coordinator = useSalesFunnelCoordinator(); // Removido para evitar dependência circular
  const realtimeSubscription = useRef<any>(null);
  const stageLoadingState = useRef<Map<string, { page: number; hasMore: boolean }>>(new Map());

  // Estado local para dados organizados
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [allLeads, setAllLeads] = useState<KanbanLead[]>([]);

  // Query principal para carregar etapas e leads iniciais
  const {
    data: funnelData,
    isLoading,
    refetch: refreshData
  } = useQuery({
    queryKey: funnelLeadsQueryKeys.byFunnel(funnelId || '', 'unified'),
    queryFn: async () => {
      if (!funnelId) return { stages: [], leads: [] };

      console.log('[FunnelDataManager] 📊 Carregando dados do funil:', funnelId);

      // Carregar etapas
      const { data: stages, error: stagesError } = await supabase
        .from('kanban_stages')
        .select('*')
        .eq('funnel_id', funnelId)
        .order('order_position');

      if (stagesError) throw stagesError;

      // Carregar leads iniciais (primeira página de cada etapa)
      const { data: leads, error: leadsError } = await supabase
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
        .limit(pageSize * stages.length); // Carregar primeira página de cada etapa

      if (leadsError) throw leadsError;

      console.log('[FunnelDataManager] ✅ Dados carregados:', {
        stages: stages.length,
        leads: leads.length,
        stagesSample: stages?.[0] ? {
          id: stages[0].id,
          name: stages[0].name,
          color: stages[0].color,
          ai_enabled: stages[0].ai_enabled,
          order_position: stages[0].order_position
        } : null,
        leadsSample: leads?.[0] ? {
          id: leads[0].id,
          name: leads[0].name,
          kanban_stage_id: leads[0].kanban_stage_id,
          funnel_id: leads[0].funnel_id
        } : null
      });

      return { stages, leads };
    },
    enabled: enabled && !!funnelId,
    staleTime: 30000, // Cache por 30 segundos
    gcTime: 300000 // Manter em cache por 5 minutos
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

    // Agrupar leads por etapa
    const leadsByStage = leads.reduce((acc, lead) => {
      const stageId = lead.kanban_stage_id;
      if (!acc[stageId]) acc[stageId] = [];
      acc[stageId].push(lead);
      return acc;
    }, {} as Record<string, KanbanLead[]>);

    // Criar colunas organizadas
    const newColumns: KanbanColumn[] = stages.map(stage => ({
      id: stage.id,
      title: stage.name,
      color: stage.color || '#6B7280',
      ai_enabled: stage.ai_enabled,
      leads: leadsByStage[stage.id] || [],
      order_position: stage.order_position
    }));

    setColumns(newColumns);
    setAllLeads(leads);

    console.log('[FunnelDataManager] 🗂️ Dados organizados em colunas:', {
      colunas: newColumns.length,
      totalLeads: leads.length,
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
        console.log('[FunnelDataManager] 📡 Atualização realtime:', payload);

        // coordinator.emit({ // Removido para evitar dependência circular
        //   type: 'realtime:update',
        //   payload,
        //   priority: 'high',
        //   source: 'FunnelDataManager'
        // });

        // Refrescar dados quando há mudanças
        refreshData();
      })
      .subscribe();

    return () => {
      if (realtimeSubscription.current) {
        realtimeSubscription.current.unsubscribe();
      }
    };
  }, [realtime, funnelId, enabled, refreshData]);

  // Carregar mais dados (scroll infinito geral)
  const loadMore = useCallback(() => {
    if (hasNextPage && !isLoadingMore) {
      console.log('[FunnelDataManager] 📜 Carregando mais dados...');

      // coordinator.emit({ // Removido para evitar dependência circular
      //   type: 'scroll:load-more',
      //   payload: { type: 'general' },
      //   priority: 'normal',
      //   source: 'FunnelDataManager'
      // });

      fetchNextPage();
    }
  }, [hasNextPage, isLoadingMore, fetchNextPage]);

  // Carregar mais dados para etapa específica
  const loadMoreForStage = useCallback(async (stageId: string) => {
    const stageState = stageLoadingState.current.get(stageId) || { page: 0, hasMore: true };

    if (!stageState.hasMore) return;

    console.log('[FunnelDataManager] 📜 Carregando mais para etapa:', stageId);

    try {
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