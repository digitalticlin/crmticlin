
import React, { useRef, useCallback, useEffect } from 'react';
import { KanbanColumn, KanbanLead } from '@/types/kanban';
import { LeadCard } from './LeadCard';
import { ColumnHeader } from './ColumnHeader';
import { DragCloneElement } from './DragCloneElement';
import { useLeadDragAndDrop } from '@/hooks/sales/useLeadDragAndDrop';
import { useDragClone } from '@/hooks/sales/useDragClone';
import { useOptimizedScrolling } from '@/hooks/sales/useOptimizedScrolling';
import { MassSelectionReturn } from '@/hooks/sales/useMassSelection';
import { cn } from '@/lib/utils';

export interface BoardContentOptimizedProps {
  columns: KanbanColumn[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onLeadUpdate: (leadId: string, updates: Partial<KanbanLead>) => void;
  onLeadDelete: (leadId: string) => void;
  onStageChange: (leadId: string, newStageId: string, oldStageId: string) => void;
  searchQuery: string;
  massSelection: MassSelectionReturn;
}

export const BoardContentOptimized: React.FC<BoardContentOptimizedProps> = ({
  columns,
  onOpenLeadDetail,
  onLeadUpdate,
  onLeadDelete,
  onStageChange,
  searchQuery,
  massSelection
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { cloneState, showClone, updateClonePosition, hideClone } = useDragClone();
  const { handleScroll } = useOptimizedScrolling();
  
  const {
    draggedLead,
    draggedFromColumn,
    dragOverColumn,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    isDragActive
  } = useLeadDragAndDrop({
    onStageChange,
    showClone,
    updateClonePosition,
    hideClone
  });

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (cloneState.isVisible) {
      const nativeEvent = e.nativeEvent as PointerEvent;
      updateClonePosition(nativeEvent.clientX, nativeEvent.clientY);
    }
  }, [cloneState.isVisible, updateClonePosition]);

  const filteredColumns = columns.map(column => ({
    ...column,
    leads: column.leads.filter(lead => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        lead.name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.toLowerCase().includes(query)
      );
    })
  }));

  return (
    <div 
      ref={containerRef}
      className="flex gap-6 h-full overflow-x-auto pb-4"
      onPointerMove={handlePointerMove}
      onScroll={handleScroll}
    >
      {filteredColumns.map((column) => (
        <div
          key={column.id}
          className={cn(
            "flex flex-col min-w-80 bg-background border rounded-lg shadow-sm transition-all duration-200",
            dragOverColumn === column.id && isDragActive && "ring-2 ring-primary/50 bg-primary/5"
          )}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <ColumnHeader 
            column={column}
            totalLeads={column.leads.length}
            filteredCount={column.leads.filter(lead => {
              if (!searchQuery) return true;
              const query = searchQuery.toLowerCase();
              return (
                lead.name?.toLowerCase().includes(query) ||
                lead.email?.toLowerCase().includes(query) ||
                lead.phone?.toLowerCase().includes(query)
              );
            }).length}
          />
          
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {column.leads
              .filter(lead => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return (
                  lead.name?.toLowerCase().includes(query) ||
                  lead.email?.toLowerCase().includes(query) ||
                  lead.phone?.toLowerCase().includes(query)
                );
              })
              .map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => onOpenLeadDetail(lead)}
                  onUpdate={(updates) => onLeadUpdate(lead.id, updates)}
                  onDelete={() => onLeadDelete(lead.id)}
                  onDragStart={(e) => handleDragStart(e, lead, column.id)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedLead?.id === lead.id}
                  isSelected={massSelection.selectedLeads.includes(lead.id)}
                  onSelectionChange={(selected) => {
                    if (selected) {
                      massSelection.selectLead(lead.id);
                    } else {
                      massSelection.deselectLead(lead.id);
                    }
                  }}
                  showCheckbox={massSelection.selectedLeads.length > 0}
                />
              ))}
            
            {column.leads.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Nenhum lead nesta etapa
              </div>
            )}
          </div>
        </div>
      ))}

      <DragCloneElement 
        cloneState={cloneState}
        lead={draggedLead}
      />
    </div>
  );
};
