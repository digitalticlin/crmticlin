import React, { useCallback } from 'react';
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
  // Verificar se está em modo de seleção em massa
  const isInSelectionMode = leadCardProps.massSelection?.isSelectionMode || false;
  const shouldDisableDnd = !enableDnd || isInSelectionMode;

  // Dados para o sistema DnD
  const dndData = {
    leadId: lead.id,
    columnId: lead.columnId,
    leadName: lead.name,
    type: 'lead'
  };

  // Se DnD desabilitado (incluindo modo seleção), renderizar LeadCard normal
  if (shouldDisableDnd) {
    return (
      <div className={className}>
        <LeadCard lead={lead} {...leadCardProps} />
      </div>
    );
  }

  // Handler para duplo clique que prioriza onOpenChat
  const handleDoubleClick = useCallback(() => {
    console.log('[DndLeadCardWrapper] 💬 DUPLO CLIQUE - ABRINDO CHAT:', { 
      leadId: lead.id, 
      leadName: lead.name 
    });
    
    // Priorizar onOpenChat para abrir chat
    if (leadCardProps.onOpenChat) {
      leadCardProps.onOpenChat();
    } else {
      leadCardProps.onClick();
    }
  }, [lead.id, lead.name, leadCardProps.onOpenChat, leadCardProps.onClick]);

  return (
    <DndDraggableCard
      id={lead.id}
      data={dndData}
      className={className}
      onClick={handleDoubleClick}
    >
      <LeadCard lead={lead} {...leadCardProps} />
    </DndDraggableCard>
  );
};