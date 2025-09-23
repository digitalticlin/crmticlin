/**
 * 🎯 UNIFIED KANBAN COLUMN
 *
 * Este componente substitui e unifica:
 * - KanbanColumn.tsx
 * - DndKanbanColumnWrapper.tsx
 *
 * Funciona com dados coordenados, sem conflitos de carregamento.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DND_CONFIG } from '@/config/dndConfig';
import { KanbanColumn as KanbanColumnType, KanbanLead } from '@/types/kanban';
import { MassSelectionCoordinatedReturn } from '@/hooks/useMassSelectionCoordinated';
import { useSalesFunnelCoordinator } from './core/SalesFunnelCoordinator';
import { LeadCardUnified } from './LeadCardUnified';
import { AIToggleSwitchEnhanced } from './ai/AIToggleSwitchEnhanced';
import { useAIStageControl } from '@/hooks/salesFunnel/useAIStageControl';
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
  className?: string;
}

const LEADS_PER_PAGE = 20;

/**
 * Coluna unificada que funciona com ou sem DnD, coordenada centralmente
 */
export const KanbanColumnUnified: React.FC<KanbanColumnUnifiedProps> = ({
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
  className
}) => {
  const coordinator = useSalesFunnelCoordinator();
  const { toggleAI, isLoading: isTogglingAI, canToggleAI } = useAIStageControl();

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
      priority: 'high' // Maior prioridade na detecção
    }
  });

  DND_CONFIG.debug.log('info', `Coluna "${column.title}" renderizada`, {
    columnId: column.id,
    leadsCount: column.leads?.length || 0,
    color: column.color,
    ai_enabled: column.ai_enabled,
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

    // Caso contrário, usar paginação local
    return column.leads.slice(0, visibleCount);
  }, [column.leads, visibleCount, hasActiveFilters]);

  // Verificar se há mais leads para carregar
  const hasMoreLeads = !hasActiveFilters && column.leads.length > visibleCount;

  // Valor total em negociação
  const totalValue = useMemo(() => {
    return column.leads.reduce((sum, lead) => {
      const value = lead.purchase_value || lead.purchaseValue || 0;
      const numericValue = typeof value === 'string' ? parseFloat(value) : value;
      return sum + (isNaN(numericValue) ? 0 : numericValue);
    }, 0);
  }, [column.leads]);

  // Handler para carregar mais leads
  const loadMoreLeads = useCallback(async () => {
    if (isLoadingMore || !hasMoreLeads) return;

    DND_CONFIG.debug.log('info', 'Carregando mais leads da coluna', { columnId: column.id, currentCount: visibleCount });

    setIsLoadingMore(true);

    // Notificar coordinator
    coordinator.emit({
      type: 'scroll:load-more',
      payload: { stageId: column.id, type: 'column' },
      priority: 'normal',
      source: 'KanbanColumn'
    });

    // Simular delay e mostrar mais leads locais
    await new Promise(resolve => setTimeout(resolve, 300));

    setVisibleCount(prev => Math.min(prev + LEADS_PER_PAGE, column.leads.length));
    setIsLoadingMore(false);

    DND_CONFIG.debug.log('info', 'Mais leads carregados com sucesso', {
      novosVisíveis: Math.min(visibleCount + LEADS_PER_PAGE, column.leads.length),
      total: column.leads.length,
      columnId: column.id
    });
  }, [isLoadingMore, hasMoreLeads, coordinator, column.id, column.leads.length, visibleCount]);

  // Handler para toggle AI
  const handleAIToggle = useCallback(async (enabled: boolean) => {
    if (!isWonLostStage) {
      console.log('[KanbanColumnUnified] 🎛️ Toggle AI:', {
        columnId: column.id,
        columnTitle: column.title,
        currentEnabled: column.ai_enabled,
        newEnabled: enabled
      });

      const success = await toggleAI(column.id, enabled);
      console.log('[KanbanColumnUnified] ✅ Toggle AI resultado:', { success });

      // Se sucesso, notificar coordinator para atualizar dados
      if (success) {
        coordinator.emit({
          type: 'realtime:update',
          payload: {
            table: 'kanban_stages',
            eventType: 'UPDATE',
            new: { ...column, ai_enabled: enabled },
            old: { ...column }
          },
          priority: 'high',
          source: 'KanbanColumnUnified'
        });
      }
    }
  }, [isWonLostStage, column, toggleAI, coordinator]);

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

  // Renderizar header da coluna
  const renderHeader = () => (
    <div className="flex items-center justify-between mb-4 px-1">
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-2">
          <h3
            className="text-sm font-medium text-gray-900 truncate"
            style={{ color: column.color }}
          >
            {column.title}
          </h3>
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
            {column.leads.length}
          </span>
        </div>
      </div>

      {/* Toggle de IA - Não mostrar para etapas GANHO e PERDIDO */}
      {!isWonLostStage && (
        <AIToggleSwitchEnhanced
          enabled={column.ai_enabled === true}
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
  );

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
    >
      {enableDnd ? (
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {visibleLeads.map((lead, index) => renderLeadCard(lead, index))}
        </SortableContext>
      ) : (
        visibleLeads.map((lead, index) => renderLeadCard(lead, index))
      )}

      {/* Botão para carregar mais */}
      {hasMoreLeads && (
        <div className="p-4 text-center">
          <button
            onClick={loadMoreLeads}
            disabled={isLoadingMore}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                Carregando...
              </>
            ) : (
              `Carregar mais (${column.leads.length - visibleCount} restantes)`
            )}
          </button>
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
          {renderHeader()}

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

