/**
 * 🎯 UNIFIED KANBAN COLUMN
 *
 * Este componente substitui e unifica:
 * - KanbanColumn.tsx
 * - DndKanbanColumnWrapper.tsx
 *
 * Funciona com dados coordenados, sem conflitos de carregamento.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';
import { DND_CONFIG } from '@/config/dndConfig';
import { KanbanColumn as KanbanColumnType, KanbanLead } from '@/types/kanban';
import { MassSelectionCoordinatedReturn } from '@/hooks/useMassSelectionCoordinated';
import { useSalesFunnelCoordinator } from './core/SalesFunnelCoordinator';
import { LeadCardUnified } from './LeadCardUnified';
import { AIToggleSwitchEnhanced } from './ai/AIToggleSwitchEnhanced';
import { useAIStageControl } from '@/hooks/salesFunnel/useAIStageControl';
import { useStageLeadCount } from '@/hooks/salesFunnel/stages/useStageLeadCount';
import { funnelDataQueryKeys } from '@/hooks/salesFunnel/core/useFunnelData';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KanbanColumnUnifiedProps {
  column: KanbanColumnType;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: 'won' | 'lost') => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  wonStageId?: string;
  lostStageId?: string;
  massSelection?: MassSelectionCoordinatedReturn;
  funnelId?: string | null;
  enableDnd?: boolean;
  hasActiveFilters?: boolean;
  // 🚀 FASE 2: Função para carregar mais leads do banco
  onLoadMoreFromDatabase?: (stageId: string) => Promise<void>;
  className?: string;
}

const LEADS_PER_PAGE = 20; // 🎯 PAGINAÇÃO: 20 leads por página

/**
 * Coluna unificada que funciona com ou sem DnD, coordenada centralmente
 */
const KanbanColumnUnifiedComponent: React.FC<KanbanColumnUnifiedProps> = ({
  column,
  onOpenLeadDetail,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false,
  wonStageId,
  lostStageId,
  massSelection,
  funnelId,
  enableDnd = true,
  hasActiveFilters = false,
  onLoadMoreFromDatabase,
  className
}) => {
  const coordinator = useSalesFunnelCoordinator();
  const { toggleAI, isLoading: isTogglingAI, canToggleAI } = useAIStageControl();
  const queryClient = useQueryClient();

  // ✅ LER AI_ENABLED DIRETAMENTE DO CACHE DO REACT QUERY
  const currentAIEnabled = useMemo(() => {
    if (!funnelId) return column.ai_enabled !== false;

    const cacheData: any = queryClient.getQueryData(funnelDataQueryKeys.byId(funnelId));
    if (!cacheData?.stages) return column.ai_enabled !== false;

    const stage = cacheData.stages.find((s: any) => s.id === column.id);
    const aiEnabled = stage?.ai_enabled !== false;

    console.log('[KanbanColumnUnified] 📖 Lendo ai_enabled do cache:', {
      columnId: column.id,
      columnTitle: column.title,
      fromCache: aiEnabled,
      fromProps: column.ai_enabled,
      hasCacheData: !!cacheData
    });

    return aiEnabled;
  }, [queryClient, funnelId, column.id, column.ai_enabled, column.title]);

  // 🔍 DEBUG: Verificar se prop está chegando
  // console.log('[KanbanColumnUnified] 🔗 Props recebidas:', {
  //   columnTitle: column.title,
  //   hasOnLoadMoreFromDatabase: !!onLoadMoreFromDatabase,
  //   onLoadMoreFromDatabaseType: typeof onLoadMoreFromDatabase
  // });

  // Hook para contar total de leads no banco de dados
  const { getStageCount, isLoading: isCountLoading } = useStageLeadCount({
    funnelId,
    enabled: !!funnelId
  });


  // Estado para paginação local (fallback quando não há infinite scroll)
  const [visibleCount, setVisibleCount] = useState(LEADS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Configurar drop zone se DnD ativo - com maior prioridade
  const {
    isOver,
    setNodeRef,
    active
  } = useDroppable({
    id: `column-${column.id}`,
    disabled: !enableDnd,
    data: {
      type: 'column',
      accepts: ['lead'],
      columnId: column.id,
      priority: 'normal' // Reduzido para evitar loops
    }
  });

  DND_CONFIG.debug.log('info', `Coluna "${column.title}" renderizada`, {
    columnId: column.id,
    leadsCount: column.leads?.length || 0,
    color: column.color,
    ai_enabled: currentAIEnabled, // ✅ Usar valor do cache
    enableDnd,
    hasActiveFilters,
    leadsDetail: column.leads?.slice(0, 3).map(lead => ({
      id: lead.id,
      name: lead.name,
      kanban_stage_id: lead.kanban_stage_id
    }))
  });

  // Verificar se é etapa GANHO ou PERDIDO
  const isWonLostStage = column.title === "GANHO" || column.title === "PERDIDO";

  // Leads visíveis (com paginação coordenada)
  const visibleLeads = useMemo(() => {
    // Se há filtros ativos, mostrar todos os leads filtrados
    if (hasActiveFilters) {
      return column.leads;
    }

    // 🚀 CORREÇÃO: Se há mais leads no banco, garantir que renderize o suficiente para scroll
    const totalInDatabase = getStageCount(column.id);
    const hasMoreInDatabase = column.leads.length < totalInDatabase;

    if (hasMoreInDatabase) {
      // Renderizar todos os leads em memória para permitir scroll
      return column.leads;
    }

    // Se não há mais no banco, usar paginação local normal
    return column.leads.slice(0, visibleCount);
  }, [column.leads, visibleCount, hasActiveFilters, column.id]);


  // Valor total em negociação
  const totalValue = useMemo(() => {
    return column.leads.reduce((sum, lead) => {
      const value = lead.purchase_value || lead.purchaseValue || 0;
      const numericValue = typeof value === 'string' ? parseFloat(value) : value;
      return sum + (isNaN(numericValue) ? 0 : numericValue);
    }, 0);
  }, [column.leads]);

  // 🚀 FASE 2: Handler para carregar mais leads do BANCO
  const loadMoreLeads = useCallback(async () => {
    console.log(`[KanbanColumnUnified] 🎯 loadMoreLeads CHAMADO - ${column.title}:`, {
      isLoadingMore,
      hasMoreLeads,
      visibleCount,
      totalInMemory: column.leads.length,
      willProceed: !isLoadingMore && hasMoreLeads
    });

    if (isLoadingMore || !hasMoreLeads) return;

    DND_CONFIG.debug.log('info', '🚀 FASE 2: Carregando mais leads do BANCO para coluna', { columnId: column.id, currentCount: visibleCount });

    setIsLoadingMore(true);

    // Notificar coordinator
    coordinator.emit({
      type: 'scroll:load-more',
      payload: { stageId: column.id, type: 'column' },
      priority: 'normal',
      source: 'KanbanColumn'
    });

    try {
      // 🚀 FASE 2: Tentar carregar do banco primeiro, senão fallback para local
      if (onLoadMoreFromDatabase) {
        console.log('[KanbanColumnUnified] 📊 Chamando onLoadMoreFromDatabase para:', column.id);
        await onLoadMoreFromDatabase(column.id);
        console.log('[KanbanColumnUnified] ✅ Leads carregados do banco com sucesso');
      } else {
        // Fallback: mostrar mais leads locais (comportamento antigo)
        console.log('[KanbanColumnUnified] ⚠️ onLoadMoreFromDatabase não encontrado - usando fallback local');
        await new Promise(resolve => setTimeout(resolve, 300));

        // ✅ CORREÇÃO: Sempre aumentar visibleCount no fallback
        const newVisibleCount = visibleCount + LEADS_PER_PAGE;
        setVisibleCount(newVisibleCount);

        console.log('[KanbanColumnUnified] 📈 Fallback: visibleCount aumentado:', {
          de: visibleCount,
          para: newVisibleCount,
          total: column.leads.length
        });
      }
    } catch (error) {
      console.error('[KanbanColumnUnified] ❌ Erro ao carregar mais leads:', error);
      // Fallback em caso de erro
      setVisibleCount(prev => Math.min(prev + LEADS_PER_PAGE, column.leads.length));
    }

    setIsLoadingMore(false);
  }, [isLoadingMore, coordinator, column.id, visibleCount, onLoadMoreFromDatabase]);

  // Verificar se há mais leads para carregar (do banco + memória local)
  const totalInDatabase = getStageCount(column.id);

  // 🛡️ CORREÇÃO: Se onLoadMoreFromDatabase não existir, usar apenas memória local
  const hasMoreLeads = !hasActiveFilters && (
    onLoadMoreFromDatabase
      ? column.leads.length < totalInDatabase  // Com função: comparar com banco
      : column.leads.length > visibleCount     // Sem função: comparar com visível
  );

  // console.log(`[KanbanColumnUnified] 📊 Scroll Check - ${column.title}:`, {
  //   visibleCount,
  //   inMemory: column.leads.length,
  //   inDatabase: totalInDatabase,
  //   hasMoreLeads,
  //   hasActiveFilters
  // });

  // Scroll listener para carregar automaticamente mais leads
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = element;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // 🔍 DEBUG: Log de todos os eventos de scroll
    if (scrollPercentage > 0.8) { // Log apenas quando próximo do final
      console.log(`[KanbanColumnUnified] 📜 Scroll Debug - ${column.title}:`, {
        scrollPercentage: Math.round(scrollPercentage * 100) + '%',
        scrollTop,
        scrollHeight,
        clientHeight,
        hasMoreLeads,
        isLoadingMore,
        visibleLeadsCount: visibleLeads.length,
        totalInMemory: column.leads.length,
        willTrigger: scrollPercentage > 0.85 && hasMoreLeads && !isLoadingMore
      });
    }

    // Quando chegar a 85% do scroll, carregar mais automaticamente
    if (scrollPercentage > 0.85 && hasMoreLeads && !isLoadingMore) {
      console.log('[KanbanColumnUnified] 🏃 Scroll 85% atingido - carregando mais leads:', {
        columnId: column.id,
        columnTitle: column.title,
        scrollPercentage: Math.round(scrollPercentage * 100) + '%',
        hasMoreLeads,
        isLoadingMore
      });
      loadMoreLeads();
    }
  }, [hasMoreLeads, isLoadingMore, loadMoreLeads, visibleLeads.length, column]);

  // Handler para toggle AI com debounce usando useRef
  const isProcessingToggle = useRef(false);
  const handleAIToggle = useCallback(async (enabled: boolean) => {
    if (!isWonLostStage && !isProcessingToggle.current) {
      isProcessingToggle.current = true;

      console.log('[KanbanColumnUnified] 🎛️ Toggle AI:', {
        columnId: column.id,
        columnTitle: column.title,
        currentEnabled: currentAIEnabled,
        newEnabled: enabled
      });

      try {
        // ✅ CORRIGIDO: Passar o estado ATUAL do cache, não das props
        const success = await toggleAI(column.id, currentAIEnabled);
        console.log('[KanbanColumnUnified] ✅ Toggle AI resultado:', { success });
      } finally {
        // Delay antes de permitir novo toggle
        setTimeout(() => {
          isProcessingToggle.current = false;
        }, 1000);
      }

      // ❌ NÃO emitir evento coordinator - React Query já gerencia
      // O realtime do Supabase já vai notificar todas as instâncias
    }
  }, [isWonLostStage, column.id, column.title, toggleAI, currentAIEnabled]);

  // IDs dos leads para SortableContext
  const leadIds = visibleLeads.map(lead => lead.id);

  // Renderizar lead cards
  const renderLeadCard = (lead: KanbanLead, index: number) => (
    <LeadCardUnified
      key={lead.id}
      lead={lead}
      onOpenLeadDetail={onOpenLeadDetail}
      onOpenChat={onOpenChat}
      onMoveToWonLost={onMoveToWonLost}
      onReturnToFunnel={onReturnToFunnel}
      isWonLostView={isWonLostView}
      wonStageId={wonStageId}
      lostStageId={lostStageId}
      massSelection={massSelection}
      enableDnd={enableDnd}
      className="mb-2"
    />
  );

  // Handlers memoizados para evitar re-renders
  const handleStageSelection = useCallback(() => {
    if (column.leads.length > 0 && massSelection?.selectStage) {
      massSelection.selectStage(column.leads);
    }
  }, [column.leads, massSelection?.selectStage]);

  const handleSelectAllFromStage = useCallback(() => {
    if (funnelId && massSelection?.selectAllFromStage) {
      massSelection.selectAllFromStage(column.id, funnelId);
    }
  }, [funnelId, column.id, massSelection?.selectAllFromStage]);

  // Renderizar header da coluna com seleção em massa (memoizado)
  const renderHeader = useMemo(() => {
    const isSelectionMode = massSelection?.isSelectionMode || false;
    const hasLeads = column.leads.length > 0;
    const stageSelectionState = isSelectionMode ? massSelection?.getStageSelectionState?.(column.leads) : 'none';

    return (
      <div className="mb-4 px-1">
        {/* Primeira linha: Título e Toggle IA */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <h3
              className="text-sm font-medium text-gray-900 truncate"
              style={{ color: column.color }}
            >
              {column.title}
            </h3>
            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
              {isCountLoading ? '...' : getStageCount(column.id)}
            </span>
          </div>

          {/* Toggle de IA - Não mostrar para etapas GANHO e PERDIDO */}
          {!isWonLostStage && (
            <AIToggleSwitchEnhanced
              enabled={currentAIEnabled} // ✅ Usar valor do cache, não das props
              onToggle={handleAIToggle}
              isLoading={isTogglingAI}
              disabled={!canToggleAI}
              size="sm"
              variant="compact"
              showLabel={true}
              className="flex-shrink-0"
            />
          )}
        </div>

        {/* Botão minimalista de seleção em massa */}
        {isSelectionMode && hasLeads && (
          <button
            onClick={handleSelectAllFromStage}
            className={cn(
              "text-xs font-medium transition-colors",
              stageSelectionState === 'all'
                ? "text-blue-600 hover:text-blue-800"
                : "text-gray-600 hover:text-gray-900"
            )}
            title={stageSelectionState === 'all'
              ? 'Desmarcar todos os leads desta etapa'
              : 'Selecionar todos os leads desta etapa'}
          >
            {stageSelectionState === 'all' ? '✓ Desmarcar todos' : 'Selecionar todos'}
          </button>
        )}
      </div>
    );
  }, [
    column.id,
    column.title,
    currentAIEnabled, // ✅ Usar valor do cache
    column.leads.length,
    massSelection?.isSelectionMode,
    funnelId,
    isWonLostStage,
    isTogglingAI,
    canToggleAI,
    isCountLoading,
    getStageCount(column.id)
    // Removidas funções instáveis: selectStage, selectAllFromStage, getStageSelectionState, handleAIToggle
  ]);

  // Renderizar valor em negociação
  const renderValue = () => (
    <div className="mb-2 text-center px-2">
      <div className="text-sm font-medium text-black">
        💰 Em negociação: {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(totalValue)}
      </div>
    </div>
  );

  // Renderizar lista de leads com área de drop otimizada
  const renderLeadsList = () => (
    <div
      className="flex-1 rounded-xl px-0.5 pt-1 pb-0 kanban-column-scrollbar overflow-y-auto overflow-x-hidden relative"
      style={{
        minHeight: "400px",
        maxHeight: "calc(100svh - 190px)",
        scrollbarColor: "#ffffff66 transparent"
      }}
      onScroll={handleScroll}
    >
      {enableDnd ? (
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {visibleLeads.map((lead, index) => renderLeadCard(lead, index))}
        </SortableContext>
      ) : (
        visibleLeads.map((lead, index) => renderLeadCard(lead, index))
      )}

      {/* Indicador de loading quando carregando automaticamente */}
      {isLoadingMore && (
        <div className="p-4 text-center">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
            Carregando mais leads...
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {visibleLeads.length === 0 && (
        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 opacity-50">
              📋
            </div>
            Nenhum lead nesta etapa
          </div>
        </div>
      )}

      {/* Área de drop extra no final - sempre visível quando há cards */}
      {enableDnd && visibleLeads.length > 0 && (
        <div
          className={cn(
            "min-h-[80px] mx-2 mb-2 rounded-lg border-2 border-dashed transition-all duration-200",
            isOver && active ?
              "border-blue-400 bg-blue-50/30" :
              "border-transparent hover:border-gray-300/50"
          )}
          style={{
            minHeight: isOver && active ? "120px" : "80px",
            transition: "all 0.2s ease"
          }}
        >
          {isOver && active && (
            <div className="h-full flex items-center justify-center">
              <div className="text-blue-500 text-sm font-medium animate-pulse">
                Solte aqui para adicionar
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Classes CSS para coluna
  const columnClasses = cn(
    // Base styles - Altura ajustada ao viewport
    "bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-2xl",
    "px-1.5 pt-1.5 pb-0 min-w-[300px] w-[300px] flex flex-col",
    "h-[calc(100vh-220px)] max-h-[calc(100vh-220px)]", // Altura calculada menos header/toolbar
    "transition-all duration-300 hover:bg-white/25 hover:shadow-glass-lg",

    // Estados de drop
    enableDnd && [
      "drop-zone",
      isOver && !active && "bg-blue-50/50 border-2 border-dashed border-blue-400/70",
      isOver && active && "bg-green-50/50 border-2 border-dashed border-green-400/70"
    ],

    className
  );

  return (
    <div className="flex flex-col">
      {renderValue()}

      <div
        ref={enableDnd ? setNodeRef : undefined}
        className={columnClasses}
        data-column-id={column.id}
        data-drop-active={enableDnd && isOver}
        style={{
          position: 'relative'
        }}
      >
        <div className="flex flex-col h-full">
          {renderHeader}

          {/* Color bar */}
          <div
            className="h-1 rounded-full mb-2 mx-1"
            style={{ backgroundColor: column.color || "#e0e0e0" }}
          />

          {renderLeadsList()}

          {/* Overlay visual para feedback de drop - sem bloquear cliques */}
          {enableDnd && isOver && active && (
            <div className="absolute inset-0 pointer-events-none rounded-2xl bg-blue-50/20 border-2 border-dashed border-blue-400/70" style={{ zIndex: 5 }}>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg animate-pulse">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  Solte aqui
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 🚨 EMERGENCY REACT.MEMO - Para quebrar loop infinito de re-renders
export const KanbanColumnUnified = React.memo(KanbanColumnUnifiedComponent, (prevProps, nextProps) => {
  // Custom comparison para evitar re-renders desnecessários
  const prev = prevProps;
  const next = nextProps;

  // Se as props básicas mudaram, re-render
  if (prev.column.id !== next.column.id ||
      prev.column.title !== next.column.title ||
      prev.isWonLostView !== next.isWonLostView ||
      prev.enableDnd !== next.enableDnd ||
      prev.hasActiveFilters !== next.hasActiveFilters) {
    return false; // Re-render
  }

  // Se número de leads mudou, re-render
  if (prev.column.leads.length !== next.column.leads.length) {
    return false; // Re-render
  }

  // Se leads específicos mudaram (shallow comparison)
  const prevLeadIds = prev.column.leads.map(l => l.id).join(',');
  const nextLeadIds = next.column.leads.map(l => l.id).join(',');
  if (prevLeadIds !== nextLeadIds) {
    return false; // Re-render
  }

  // Se massSelection mudou de modo OU se o número de leads selecionados mudou
  if (prev.massSelection?.isSelectionMode !== next.massSelection?.isSelectionMode) {
    return false; // Re-render
  }

  // 🔥 CRÍTICO: Verificar se o número de leads selecionados mudou
  if (prev.massSelection?.selectedCount !== next.massSelection?.selectedCount) {
    return false; // Re-render
  }

  // Caso contrário, manter props anteriores (não re-render)
  return true; // NÃO re-render
});

