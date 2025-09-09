import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndLeadCardWrapper } from './DndLeadCardWrapper';
import { KanbanLead } from '@/types/kanban';
import { MassSelectionReturn } from '@/hooks/useMassSelection';

interface DndSortableLeadCardProps {
  lead: KanbanLead;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWon?: () => void;
  onMoveToLost?: () => void;
  onReturnToFunnel?: () => void;
  isWonLostView?: boolean;
  wonStageId?: string;
  lostStageId?: string;
  massSelection?: MassSelectionReturn;
  enableDnd?: boolean;
  className?: string;
}

/**
 * Wrapper sortable para lead cards que permite reordenação dentro da coluna
 * e movimentação entre colunas
 */
export const DndSortableLeadCard: React.FC<DndSortableLeadCardProps> = ({
  lead,
  onOpenLeadDetail,
  onOpenChat,
  onMoveToWon,
  onMoveToLost,
  onReturnToFunnel,
  isWonLostView = false,
  wonStageId,
  lostStageId,
  massSelection,
  enableDnd = false,
  className
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting
  } = useSortable({
    id: lead.id,
    disabled: !enableDnd,
    data: {
      type: 'lead',
      leadId: lead.id,
      columnId: lead.columnId,
      leadName: lead.name
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Se não estiver habilitado para DnD, renderizar wrapper normal
  if (!enableDnd) {
    return (
      <DndLeadCardWrapper
        lead={lead}
        onClick={() => onOpenLeadDetail(lead)}
        onOpenChat={onOpenChat ? () => onOpenChat(lead) : undefined}
        onMoveToWon={onMoveToWon}
        onMoveToLost={onMoveToLost}
        onReturnToFunnel={onReturnToFunnel}
        isWonLostView={isWonLostView}
        wonStageId={wonStageId}
        lostStageId={lostStageId}
        massSelection={massSelection}
        enableDnd={false}
        className={className}
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className || ''} ${isDragging ? 'opacity-50 z-50' : ''} ${isSorting ? 'transition-transform' : ''}`}
      {...attributes}
      {...listeners}
    >
      <DndLeadCardWrapper
        lead={lead}
        onClick={() => onOpenLeadDetail(lead)}
        onOpenChat={onOpenChat ? () => onOpenChat(lead) : undefined}
        onMoveToWon={onMoveToWon}
        onMoveToLost={onMoveToLost}
        onReturnToFunnel={onReturnToFunnel}
        isWonLostView={isWonLostView}
        wonStageId={wonStageId}
        lostStageId={lostStageId}
        massSelection={massSelection}
        enableDnd={enableDnd}
      />
    </div>
  );
};