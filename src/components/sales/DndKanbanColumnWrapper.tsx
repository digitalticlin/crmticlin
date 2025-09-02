import React from 'react';
import { DndDropZone } from '@/components/dnd';
import { DndLeadCardWrapper } from './DndLeadCardWrapper';
import { KanbanColumn as KanbanColumnType, KanbanLead } from '@/types/kanban';
import { MassSelectionReturn } from '@/hooks/useMassSelection';

interface DndKanbanColumnWrapperProps {
  column: KanbanColumnType;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: 'won' | 'lost') => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  wonStageId?: string;
  lostStageId?: string;
  massSelection?: MassSelectionReturn;
  // Novo sistema DnD
  enableDnd?: boolean;
  className?: string;
  maxVisibleLeads?: number;
}

/**
 * Wrapper para KanbanColumn que suporta o novo sistema @dnd-kit
 * Mantém compatibilidade total com funcionalidades existentes
 */
export const DndKanbanColumnWrapper: React.FC<DndKanbanColumnWrapperProps> = ({
  column,
  onOpenLeadDetail,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false,
  wonStageId,
  lostStageId,
  massSelection,
  enableDnd = false,
  className,
  maxVisibleLeads = 25
}) => {
  // Limitar leads para performance
  const visibleLeads = column.leads.slice(0, maxVisibleLeads);
  const hasMoreLeads = column.leads.length > maxVisibleLeads;

  const renderLeadCard = (lead: KanbanLead, index: number) => (
    <DndLeadCardWrapper
      key={lead.id}
      lead={lead}
      enableDnd={enableDnd}
      onClick={() => onOpenLeadDetail(lead)}
      onOpenChat={onOpenChat ? () => onOpenChat(lead) : undefined}
      onMoveToWon={onMoveToWonLost ? () => onMoveToWonLost(lead, 'won') : undefined}
      onMoveToLost={onMoveToWonLost ? () => onMoveToWonLost(lead, 'lost') : undefined}
      onReturnToFunnel={onReturnToFunnel ? () => onReturnToFunnel(lead) : undefined}
      isWonLostView={isWonLostView}
      wonStageId={wonStageId}
      lostStageId={lostStageId}
      massSelection={massSelection}
      className="mb-2"
    />
  );

  // Conteúdo da coluna
  const columnContent = (
    <div className="flex flex-col h-full">
      {/* Header da coluna - aparência original */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2 flex-1">
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

      {/* Color bar - aparência original */}
      <div
        className="h-1 rounded-full mb-2 mx-1"
        style={{ backgroundColor: column.color || "#e0e0e0" }}
      />

      {/* Lista de leads - aparência original */}
      <div
        className="flex-1 rounded-xl px-0.5 pt-1 pb-0 kanban-column-scrollbar overflow-y-auto overflow-x-hidden"
        style={{
          minHeight: "400px",
          maxHeight: "calc(100svh - 190px)",
          scrollbarColor: "#ffffff66 transparent"
        }}
      >
        {visibleLeads.map((lead, index) => renderLeadCard(lead, index))}
        
        {hasMoreLeads && (
          <div className="p-2 text-center text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded mx-1 mb-2">
            +{column.leads.length - maxVisibleLeads} leads adicionais
            <br />
            <span className="text-blue-600">Use filtros para ver mais</span>
          </div>
        )}
        
        {column.leads.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 opacity-50">
                📋
              </div>
              Nenhum lead nesta etapa
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Se DnD habilitado, envolver em DndDropZone (aparência original)
  if (enableDnd) {
    return (
      <DndDropZone 
        id={column.id}
        className={`bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-2xl px-1.5 pt-1.5 pb-0 min-w-[300px] w-[300px] flex flex-col h-full transition-all duration-300 hover:bg-white/25 hover:shadow-glass-lg ${className || ''}`}
      >
        {columnContent}
      </DndDropZone>
    );
  }

  // Sem DnD - renderização normal (aparência original)
  return (
    <div className={`bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-2xl px-1.5 pt-1.5 pb-0 min-w-[300px] w-[300px] flex flex-col h-full transition-all duration-300 hover:bg-white/25 hover:shadow-glass-lg ${className || ''}`}>
      {columnContent}
    </div>
  );
};