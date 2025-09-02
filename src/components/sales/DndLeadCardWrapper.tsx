import React from 'react';
import { DndDraggableCard } from '@/components/dnd';
import { LeadCard } from './LeadCard';
import { KanbanLead } from '@/types/kanban';
import { MassSelectionReturn } from '@/hooks/useMassSelection';

interface DndLeadCardWrapperProps {
  lead: KanbanLead;
  onClick: () => void;
  onOpenChat?: () => void;
  onMoveToWon?: () => void;
  onMoveToLost?: () => void;
  onReturnToFunnel?: () => void;
  isWonLostView?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  wonStageId?: string;
  lostStageId?: string;
  massSelection?: MassSelectionReturn;
  // Novo sistema DnD
  enableDnd?: boolean;
  className?: string;
}

/**
 * Wrapper que permite o LeadCard funcionar com o novo sistema @dnd-kit
 * mantendo 100% de compatibilidade com o sistema atual
 */
export const DndLeadCardWrapper: React.FC<DndLeadCardWrapperProps> = ({
  lead,
  enableDnd = false,
  className,
  ...leadCardProps
}) => {
  // Dados para o sistema DnD
  const dndData = {
    leadId: lead.id,
    columnId: lead.columnId,
    leadName: lead.name,
    type: 'lead'
  };

  // Se DnD desabilitado, renderizar LeadCard normal
  if (!enableDnd) {
    return (
      <div className={className}>
        <LeadCard lead={lead} {...leadCardProps} />
      </div>
    );
  }

  // Com DnD habilitado
  return (
    <DndDraggableCard
      id={lead.id}
      data={dndData}
      className={className}
      onClick={leadCardProps.onClick}
    >
      <LeadCard lead={lead} {...{...leadCardProps, onClick: undefined}} />
    </DndDraggableCard>
  );
};