import React, { useCallback } from 'react';
import { DndKanbanWrapper, useDndKanban } from '@/components/dnd';
import { DndKanbanColumnWrapper } from './DndKanbanColumnWrapper';
import { DataErrorBoundary } from './funnel/DataErrorBoundary';
import { KanbanColumn as IKanbanColumn, KanbanLead } from '@/types/kanban';
import { MassSelectionReturn } from '@/hooks/useMassSelection';
import { DragEndEvent } from '@dnd-kit/core';

interface DndKanbanBoardWrapperProps {
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
  // Sistema híbrido
  enableDnd?: boolean;
  className?: string;
}

/**
 * Board híbrido que pode funcionar com ou sem DnD
 * Permite migração gradual sem quebrar funcionalidades
 */
export const DndKanbanBoardWrapper: React.FC<DndKanbanBoardWrapperProps> = ({
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
  enableDnd = false,
  className
}) => {

  // Converter colunas para formato do useDndKanban
  const dndColumns = columns.map(column => ({
    id: column.id,
    title: column.title,
    color: column.color,
    items: column.leads.map(lead => ({
      id: lead.id,
      columnId: lead.columnId,
      ...lead
    }))
  }));

  // Hook do DnD (só usado se enableDnd = true)
  const dndKanban = useDndKanban({
    initialColumns: dndColumns,
    onItemMove: useCallback((itemId: string, fromColumnId: string, toColumnId: string, newIndex: number) => {
      
      // Encontrar o lead
      const fromColumn = columns.find(col => col.id === fromColumnId);
      const lead = fromColumn?.leads.find(l => l.id === itemId);
      
      if (!lead || !fromColumn) {
        console.error('Lead ou coluna não encontrada:', { itemId, fromColumnId });
        return;
      }

      // Criar novas colunas com o lead movido
      const newColumns = columns.map(column => {
        if (column.id === fromColumnId) {
          // Remover da coluna origem
          return {
            ...column,
            leads: column.leads.filter(l => l.id !== itemId)
          };
        } else if (column.id === toColumnId) {
          // Adicionar na coluna destino
          const updatedLead = { ...lead, columnId: toColumnId };
          const newLeads = [...column.leads];
          newLeads.splice(newIndex, 0, updatedLead);
          return {
            ...column,
            leads: newLeads
          };
        }
        return column;
      });

      onColumnsChange(newColumns);
    }, [columns, onColumnsChange])
  });

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    dndKanban.handleDragEnd(event);
  }, [dndKanban]);

  const isEmpty = !columns || columns.length === 0;

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isWonLostView ? "Nenhum lead ganho/perdido" : "Nenhuma etapa encontrada"}
          </h3>
          <p className="text-gray-600 mb-4">
            {isWonLostView 
              ? "Nenhum lead foi ganho ou perdido ainda" 
              : "Configure as etapas do seu funil para começar"
            }
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  const boardContent = (
    <div className={`flex gap-6 min-w-max px-6 py-4 ${className || ''}`}>
      {columns.map(column => (
        <DndKanbanColumnWrapper
          key={column.id}
          column={column}
          onOpenLeadDetail={onOpenLeadDetail}
          onOpenChat={onOpenChat}
          onMoveToWonLost={onMoveToWonLost}
          onReturnToFunnel={onReturnToFunnel}
          isWonLostView={isWonLostView}
          wonStageId={wonStageId}
          lostStageId={lostStageId}
          massSelection={massSelection}
          enableDnd={enableDnd}
        />
      ))}
    </div>
  );

  return (
    <div className="relative w-full h-full flex flex-col">
      <DataErrorBoundary context={`Kanban Board - DnD ${enableDnd ? 'Enabled' : 'Disabled'}`}>
        {enableDnd ? (
          <DndKanbanWrapper 
            onDragEnd={handleDragEnd}
            className="flex-1"
          >
            {boardContent}
          </DndKanbanWrapper>
        ) : (
          <div className="flex-1 overflow-x-auto">
            {boardContent}
          </div>
        )}
        
      </DataErrorBoundary>
    </div>
  );
};