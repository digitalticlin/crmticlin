/**
 * 🎯 UNIFIED SALES FUNNEL HOOK
 *
 * Este hook substitui TODOS os hooks do funil e coordena tudo:
 * - useSalesFunnelOptimized
 * - useSalesFunnelWithFilters
 * - useFunnelLeads
 * - useLeadsRealtime
 * - useMassSelection (via coordenado)
 *
 * É o ÚNICO ponto de entrada para dados do funil.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFunnelDataManager } from './useFunnelDataManager';
import { useMassSelectionCoordinated } from '@/hooks/useMassSelectionCoordinated';
import { useSalesFunnelCoordinator } from '@/components/sales/core/SalesFunnelCoordinator';
import { KanbanColumn, KanbanLead } from '@/types/kanban';

interface FilterOptions {
  searchTerm?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  valueRange?: {
    min: number;
    max: number;
  };
  assignedUser?: string;
}

interface FunnelOptions {
  funnelId?: string | null;
  enableDnd?: boolean;
  enableRealtime?: boolean;
  enableFilters?: boolean;
  enableMassSelection?: boolean;
  pageSize?: number;
}

interface FunnelState {
  // Dados principais
  columns: KanbanColumn[];
  allLeads: KanbanLead[];
  filteredColumns: KanbanColumn[];

  // Estados de carregamento
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;

  // Estados de funcionalidades
  hasActiveFilters: boolean;
  isDndActive: boolean;

  // Filtros ativos
  activeFilters: FilterOptions;

  // Seleção em massa
  massSelection: ReturnType<typeof useMassSelectionCoordinated>;

  // Estatísticas
  totalLeads: number;
  filteredLeadsCount: number;
  leadsPerStage: Record<string, number>;
}

interface FunnelActions {
  // Ações de dados
  refreshData: () => void;
  loadMore: () => void;
  loadMoreForStage: (stageId: string) => void;

  // Ações de filtros
  applyFilters: (filters: FilterOptions) => void;
  clearFilters: () => void;

  // Ações de colunas
  updateColumns: (newColumns: KanbanColumn[]) => void;

  // Ações de otimização
  optimizeForSize: (leadCount: number) => void;
}

export interface SalesFunnelUnifiedReturn extends FunnelState, FunnelActions {}

/**
 * Hook unificado que gerencia TUDO do Sales Funnel sem conflitos
 */
export const useSalesFunnelUnified = (options: FunnelOptions): SalesFunnelUnifiedReturn => {
  const {
    funnelId,
    enableDnd = true,
    enableRealtime = true,
    enableFilters = true,
    enableMassSelection = true,
    pageSize = 50 // 🚀 FASE 1: Aumentado de 30 → 50 para melhor carregamento
  } = options;

  // Hooks especializados coordenados
  const coordinator = useSalesFunnelCoordinator();
  const massSelection = useMassSelectionCoordinated(coordinator);

  // Estados locais
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
  const [optimizationLevel, setOptimizationLevel] = useState<'simple' | 'moderate' | 'massive'>('simple');

  // Hook de dados principal
  const dataManager = useFunnelDataManager({
    funnelId,
    enabled: !!funnelId,
    pageSize,
    realtime: enableRealtime,
    coordinator // Passar coordinator para o dataManager
  });

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return Object.keys(activeFilters).some(key => {
      const value = activeFilters[key as keyof FilterOptions];
      if (key === 'searchTerm') return !!value;
      if (key === 'tags') return Array.isArray(value) && value.length > 0;
      if (key === 'dateRange' || key === 'valueRange') return !!value;
      if (key === 'assignedUser') return !!value;
      return false;
    });
  }, [activeFilters]);

  // Aplicar filtros aos dados
  const filteredColumns = useMemo(() => {
    if (!hasActiveFilters) {
      return dataManager.columns;
    }

    // console.log('[SalesFunnelUnified] 🔍 Aplicando filtros:', activeFilters);

    return dataManager.columns.map(column => {
      let filteredLeads = column.leads;

      // Filtro por termo de busca
      if (activeFilters.searchTerm) {
        const searchTerm = activeFilters.searchTerm.toLowerCase();
        filteredLeads = filteredLeads.filter(lead =>
          lead.name?.toLowerCase().includes(searchTerm) ||
          lead.email?.toLowerCase().includes(searchTerm) ||
          lead.phone?.includes(searchTerm)
        );
      }

      // Filtro por tags
      if (activeFilters.tags && activeFilters.tags.length > 0) {
        filteredLeads = filteredLeads.filter(lead => {
          // ✅ CORREÇÃO: usar lead.tags em vez de lead.lead_tags
          const hasMatchingTag = lead.tags?.some(tag =>
            activeFilters.tags!.includes(tag.id)
          );

          // if (hasMatchingTag) {
          //   console.log('[SalesFunnelUnified] 🏷️ Lead com tag match:', {
          //     leadName: lead.name,
          //     leadTags: lead.tags?.map(t => t.name),
          //     filterTags: activeFilters.tags
          //   });
          // }

          return hasMatchingTag;
        });
      }

      // Filtro por usuário responsável
      if (activeFilters.assignedUser && activeFilters.assignedUser !== "all") {
        filteredLeads = filteredLeads.filter(lead => {
          const hasUser = lead.assignedUser === activeFilters.assignedUser ||
                         lead.owner_id === activeFilters.assignedUser;

          // if (hasUser) {
          //   console.log('[SalesFunnelUnified] 👤 Lead com usuário match:', {
          //     leadName: lead.name,
          //     leadUser: lead.assignedUser || lead.owner_id,
          //     filterUser: activeFilters.assignedUser
          //   });
          // }

          return hasUser;
        });
      }

      // Filtro por valor
      if (activeFilters.valueRange) {
        const { min, max } = activeFilters.valueRange;
        filteredLeads = filteredLeads.filter(lead => {
          const value = lead.purchase_value || 0;
          const numericValue = typeof value === 'string' ? parseFloat(value) : value;
          return numericValue >= min && numericValue <= max;
        });
      }

      // Filtro por data
      if (activeFilters.dateRange) {
        const { start, end } = activeFilters.dateRange;
        filteredLeads = filteredLeads.filter(lead => {
          const leadDate = new Date(lead.created_at);
          return leadDate >= start && leadDate <= end;
        });
      }

      return {
        ...column,
        leads: filteredLeads
      };
    });
  }, [dataManager.columns, activeFilters, hasActiveFilters]);

  // Contar leads filtrados
  const filteredLeadsCount = useMemo(() => {
    return filteredColumns.reduce((total, column) => total + column.leads.length, 0);
  }, [filteredColumns]);

  // Determinar se DnD deve estar ativo
  const isDndActive = useMemo(() => {
    return enableDnd; // Simplificado - DnD sempre ativo quando habilitado
  }, [enableDnd]);

  // Aplicar filtros
  const applyFilters = useCallback((filters: FilterOptions) => {
    // console.log('[SalesFunnelUnified] 📋 Aplicando novos filtros:', filters);

    setActiveFilters(filters);

    // Notificar coordinator
    coordinator.emit({
      type: 'filter:apply',
      payload: filters,
      priority: 'high',
      source: 'SalesFunnelUnified'
    });
  }, [coordinator]);

  // Throttle para evitar loops infinitos
  const lastClearTime = useRef<number>(0);
  const CLEAR_THROTTLE_MS = 1000; // 1 segundo entre clears

  // clearFilters com proteção contra loops e debug
  const clearFilters = useCallback(() => {
    const now = Date.now();

    console.log('[SalesFunnelUnified] 🔍 DEBUG clearFilters chamado:', {
      stack: new Error().stack?.split('\n')[2], // Linha que chamou
      activeFilters,
      lastClearTime: lastClearTime.current,
      timeSinceLastClear: now - lastClearTime.current
    });

    // Throttle: só executa se passou tempo suficiente desde o último clear
    if (now - lastClearTime.current < CLEAR_THROTTLE_MS) {
      console.log('[SalesFunnelUnified] 🚫 clearFilters throttled - aguardando',
        CLEAR_THROTTLE_MS - (now - lastClearTime.current), 'ms');
      return;
    }

    // Verificar se já está limpo para evitar clear desnecessário
    const hasFiltersToRemove = Object.keys(activeFilters).some(key => {
      const value = activeFilters[key as keyof FilterOptions];
      if (key === 'searchTerm') return !!value;
      if (key === 'tags') return Array.isArray(value) && value.length > 0;
      if (key === 'dateRange' || key === 'valueRange') return !!value;
      if (key === 'assignedUser') return !!value && value !== 'all';
      return false;
    });

    if (!hasFiltersToRemove) {
      console.log('[SalesFunnelUnified] ✅ Filtros já estão limpos - não fazendo nada');
      return;
    }

    console.log('[SalesFunnelUnified] 🧹 Limpando filtros:', {
      before: activeFilters,
      totalLeadsBefore: filteredLeadsCount
    });

    lastClearTime.current = now;

    // Limpar filtros forçando objeto vazio novo
    setActiveFilters({
      searchTerm: '',
      tags: [],
      assignedUser: 'all'
    });

    // Emit com throttle também
    coordinator.emit({
      type: 'filter:clear',
      payload: {},
      priority: 'normal', // Reduzido de 'high' para 'normal'
      source: 'SalesFunnelUnified'
    });
  }, [activeFilters, coordinator, filteredLeadsCount]);

  // Otimizar baseado no tamanho dos dados
  const optimizeForSize = useCallback((leadCount: number) => {
    let newLevel: typeof optimizationLevel;

    if (leadCount < 100) {
      newLevel = 'simple';
    } else if (leadCount < 500) {
      newLevel = 'moderate';
    } else {
      newLevel = 'massive';
    }

    if (newLevel !== optimizationLevel) {
      setOptimizationLevel(newLevel);
      console.log('[SalesFunnelUnified] ⚡ Nível de otimização alterado:', {
        leadCount,
        from: optimizationLevel,
        to: newLevel
      });
    }
  }, [optimizationLevel]);

  // Auto-otimização baseada no volume de dados
  useEffect(() => {
    const totalLeads = dataManager.totalLeads;
    if (totalLeads > 0) {
      optimizeForSize(totalLeads);
    }
  }, [dataManager.totalLeads, optimizeForSize]);

  // LOGS TEMPORARIAMENTE DESABILITADOS para reduzir re-renders
  // const [lastLogTime, setLastLogTime] = useState(0);

  // useEffect(() => {
  //   const now = Date.now();
  //   const THROTTLE_LOGS_MS = 2000;

  //   if (now - lastLogTime > THROTTLE_LOGS_MS) {
  //     console.log('[SalesFunnelUnified] 📊 Estado atual:', {
  //       funnelId,
  //       totalLeads: dataManager.totalLeads,
  //       filteredLeads: filteredLeadsCount,
  //       hasActiveFilters,
  //       isDndActive,
  //       isSelectionMode: massSelection.isSelectionMode,
  //       optimizationLevel
  //     });
  //     setLastLogTime(now);
  //   }
  // }, [
  //   funnelId,
  //   dataManager.totalLeads,
  //   filteredLeadsCount,
  //   hasActiveFilters,
  //   isDndActive,
  //   massSelection.isSelectionMode,
  //   optimizationLevel,
  //   lastLogTime
  // ]);


  // Calcular estado de loading corretamente
  const isLoading = !funnelId || dataManager.isLoading;

  return {
    // Dados principais
    columns: filteredColumns,
    allLeads: dataManager.allLeads,
    filteredColumns,

    // Estados de carregamento
    isLoading,
    isLoadingMore: dataManager.isLoadingMore,
    hasNextPage: dataManager.hasNextPage,

    // Estados de funcionalidades
    hasActiveFilters,
    isDndActive,

    // Filtros ativos
    activeFilters,

    // Seleção em massa
    massSelection,

    // Estatísticas
    totalLeads: dataManager.totalLeads,
    filteredLeadsCount,
    leadsPerStage: dataManager.leadsPerStage,

    // Ações de dados
    refreshData: dataManager.refreshData,
    loadMore: dataManager.loadMore,
    loadMoreForStage: dataManager.loadMoreForStage,

    // Ações de filtros
    applyFilters,
    clearFilters,

    // Ações de colunas
    updateColumns: (newColumns: KanbanColumn[]) => {
      console.log('[SalesFunnelUnified] 🔄 Atualizando colunas:', newColumns.length);

      // Atualizar o estado do dataManager diretamente
      // Como dataManager não expõe setColumns, vamos usar refreshData
      // ou emitir um evento para o coordinator
      if (coordinator) {
        coordinator.emit({
          type: 'dnd:end',
          payload: { columns: newColumns },
          priority: 'high',
          source: 'SalesFunnelUnified'
        });
      }

      // Forçar refresh dos dados para garantir sincronização
      dataManager.refreshData();
    },

    // Ações de otimização
    optimizeForSize,

    // Update otimista para leads (importante para DnD e Won/Lost)
    updateLeadOptimistic: (leadId: string, updates: Partial<KanbanLead>) => {
      // Atualizar localmente primeiro para feedback instantâneo
      if (coordinator) {
        coordinator.emit({
          type: 'lead:optimistic-update',
          payload: { leadId, updates },
          priority: 'immediate',
          source: 'SalesFunnelUnified'
        });
      }

      // O dataManager deve processar isso internamente
      // Por enquanto, fazemos refresh após um delay para sincronizar
      setTimeout(() => dataManager.refreshData(), 500);
    }
  };
};