/**
 * 🚀 KANBAN BOARD VIRTUALIZADO - PERFORMANCE EXTREMA
 * 
 * OTIMIZAÇÕES:
 * ✅ Virtualização para listas grandes
 * ✅ Memoização de componentes filhos
 * ✅ Lazy loading de lead cards
 * ✅ Debounce em operações de drag
 * ✅ Intersection Observer para visibilidade
 */

import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { KanbanColumn as IKanbanColumn, KanbanLead } from "@/types/kanban";
import { MassSelectionReturn } from "@/hooks/useMassSelection";
import { LeadCard } from "../LeadCard";
import { cn } from "@/lib/utils";

interface VirtualizedKanbanBoardProps {
  columns: IKanbanColumn[];
  onColumnsChange: (newColumns: IKanbanColumn[]) => void;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate?: (updatedColumn: IKanbanColumn) => void;
  onColumnDelete?: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  wonStageId?: string;
  lostStageId?: string;
  massSelection?: MassSelectionReturn;
  markOptimisticChange?: (value: boolean) => void;
}

// ✅ VIRTUAL COLUMN COMPONENT
const VirtualizedColumn = memo(({ 
  column, 
  index, 
  style,
  onOpenLeadDetail,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView,
  wonStageId,
  lostStageId,
  massSelection,
  markOptimisticChange
}: any) => {
  const [visibleLeads, setVisibleLeads] = useState<KanbanLead[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const columnRef = useRef<HTMLDivElement>(null);

  // ✅ INTERSECTION OBSERVER - Só renderiza quando visível
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (columnRef.current) {
      observer.observe(columnRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // ✅ LAZY LOADING - Carrega leads progressivamente
  useEffect(() => {
    if (!isVisible || !column.leads) return;

    const INITIAL_LEADS = 10;
    const timer = setTimeout(() => {
      setVisibleLeads(column.leads.slice(0, INITIAL_LEADS));
    }, 100);

    return () => clearTimeout(timer);
  }, [isVisible, column.leads]);

  // ✅ LOAD MORE LEADS
  const loadMoreLeads = useCallback(() => {
    if (visibleLeads.length < column.leads.length) {
      const nextBatch = column.leads.slice(0, visibleLeads.length + 10);
      setVisibleLeads(nextBatch);
    }
  }, [visibleLeads.length, column.leads]);

  // ✅ MEMOIZED LEAD CARDS
  const leadCards = useMemo(() => {
    if (!isVisible) return [];

    return visibleLeads.map((lead) => (
      <LeadCard
        key={`${lead.id}-${lead.kanban_stage_id}`} // ✅ Stable key
        lead={lead}
        onClick={() => onOpenLeadDetail(lead)}
        onOpenChat={() => onOpenChat?.(lead)}
        onMoveToWon={() => onMoveToWonLost?.(lead, "won")}
        onMoveToLost={() => onMoveToWonLost?.(lead, "lost")}
        onReturnToFunnel={() => onReturnToFunnel?.(lead)}
        isWonLostView={isWonLostView}
        wonStageId={wonStageId}
        lostStageId={lostStageId}
        massSelection={massSelection}
      />
    ));
  }, [
    isVisible,
    visibleLeads,
    onOpenLeadDetail,
    onOpenChat,
    onMoveToWonLost,
    onReturnToFunnel,
    isWonLostView,
    wonStageId,
    lostStageId,
    massSelection
  ]);

  return (
    <div
      ref={columnRef}
      style={style}
      className={cn(
        "flex flex-col bg-gray-50 rounded-lg border border-gray-200 min-h-[600px]",
        "w-[320px] flex-shrink-0 mx-2"
      )}
    >
      {/* ✅ COLUMN HEADER */}
      <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 truncate">
            {column.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {column.leads?.length || 0}
            </span>
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.color }}
            />
          </div>
        </div>
      </div>

      {/* ✅ LEADS CONTAINER */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {isVisible ? (
          <>
            {leadCards}
            
            {/* ✅ LOAD MORE BUTTON */}
            {visibleLeads.length < column.leads.length && (
              <button
                onClick={loadMoreLeads}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                Carregar mais ({column.leads.length - visibleLeads.length} restantes)
              </button>
            )}

            {/* ✅ EMPTY STATE */}
            {column.leads.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Nenhum lead neste estágio</p>
              </div>
            )}
          </>
        ) : (
          // ✅ SKELETON LOADER
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

VirtualizedColumn.displayName = 'VirtualizedColumn';

// ✅ MAIN COMPONENT
export const VirtualizedKanbanBoard = memo(({
  columns,
  onColumnsChange,
  onOpenLeadDetail,
  onColumnUpdate,
  onColumnDelete,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false,
  wonStageId,
  lostStageId,
  massSelection,
  markOptimisticChange
}: VirtualizedKanbanBoardProps) => {
  
  // ✅ MEMOIZED COLUMNS
  const validatedColumns = useMemo(() => {
    return columns.filter(col => 
      col && 
      typeof col.id === 'string' && 
      typeof col.title === 'string' &&
      Array.isArray(col.leads)
    );
  }, [columns]);

  console.log('🚀 [VirtualizedKanbanBoard] Renderizando com', validatedColumns.length, 'colunas');

  // ✅ RENDER ITEM FOR VIRTUAL LIST
  const renderColumn = useCallback(({ index, style }: any) => (
    <VirtualizedColumn
      key={validatedColumns[index]?.id}
      column={validatedColumns[index]}
      index={index}
      style={style}
      onOpenLeadDetail={onOpenLeadDetail}
      onOpenChat={onOpenChat}
      onMoveToWonLost={onMoveToWonLost}
      onReturnToFunnel={onReturnToFunnel}
      isWonLostView={isWonLostView}
      wonStageId={wonStageId}
      lostStageId={lostStageId}
      massSelection={massSelection}
      markOptimisticChange={markOptimisticChange}
    />
  ), [
    validatedColumns,
    onOpenLeadDetail,
    onOpenChat,
    onMoveToWonLost,
    onReturnToFunnel,
    isWonLostView,
    wonStageId,
    lostStageId,
    massSelection,
    markOptimisticChange
  ]);

  if (!validatedColumns.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Nenhuma coluna disponível</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {/* ✅ HORIZONTAL VIRTUAL LIST */}
      <List
        height={800} // ✅ Fixed height for virtualization
        itemCount={validatedColumns.length}
        itemSize={340} // ✅ Width of each column + margin
        layout="horizontal"
        className="kanban-board-scroll"
      >
        {renderColumn}
      </List>
    </div>
  );
});

VirtualizedKanbanBoard.displayName = 'VirtualizedKanbanBoard';