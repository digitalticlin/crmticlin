import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndLeadCardWrapper } from './DndLeadCardWrapper';
import { LeadCard } from './LeadCard';
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
 * Nova abordagem: DOIS COMPONENTES SEPARADOS
 * - Um APENAS para clique (sem DnD)
 * - Outro APENAS para DnD (sem clique interno)
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
  // Desabilitar DnD se estivermos em modo de seleção em massa
  const isInSelectionMode = massSelection?.isSelectionMode || false;
  const isDndDisabled = !enableDnd || isInSelectionMode;

  // Se DnD estiver desabilitado, usar componente APENAS PARA CLIQUE
  if (isDndDisabled) {
    console.log('[DndSortableLeadCard] 🚫 DnD DESABILITADO - usando componente puro de clique');
    return (
      <div className={className}>
        <LeadCard
          lead={lead}
          onClick={() => {
            console.log('[DndSortableLeadCard] 🔄 onClick (modo puro)');
            onOpenLeadDetail(lead);
          }}
          onOpenChat={onOpenChat ? () => {
            console.log('[DndSortableLeadCard] 💬 onOpenChat (modo puro)');
            onOpenChat(lead);
          } : undefined}
          onMoveToWon={onMoveToWon}
          onMoveToLost={onMoveToLost}
          onReturnToFunnel={onReturnToFunnel}
          isWonLostView={isWonLostView}
          wonStageId={wonStageId}
          lostStageId={lostStageId}
          massSelection={massSelection}
        />
      </div>
    );
  }

  // Se DnD habilitado, usar DnD-kit SEM listeners no nível do LeadCard
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
    disabled: false, // Sempre ativo quando chegamos aqui
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

  console.log('[DndSortableLeadCard] ✅ DnD HABILITADO - usando componente misto');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className || ''} ${isDragging ? 'opacity-50 z-50' : ''} ${isSorting ? 'transition-transform' : ''} relative`}
      {...attributes}
    >
      {/* ÁREA DE DRAG: Handle invisível apenas no topo do card */}
      <div
        className="absolute top-0 left-0 w-full h-8 z-30 cursor-move"
        style={{ 
          background: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        }}
        {...listeners}
        title="Arraste para mover o lead"
      />
      
      {/* ÁREA DE CLIQUE: LeadCard normal com cliques funcionando */}
      <div className="relative z-20">
        <LeadCard
          lead={lead}
          onClick={() => {
            console.log('[DndSortableLeadCard] 🔄 onClick do LeadCard (área de clique)');
            if (!isDragging) {
              onOpenLeadDetail(lead);
            }
          }}
          onOpenChat={onOpenChat ? () => {
            console.log('[DndSortableLeadCard] 💬 onOpenChat do LeadCard (área de clique)');
            if (!isDragging) {
              onOpenChat(lead);
            }
          } : undefined}
          onMoveToWon={onMoveToWon}
          onMoveToLost={onMoveToLost}
          onReturnToFunnel={onReturnToFunnel}
          isWonLostView={isWonLostView}
          wonStageId={wonStageId}
          lostStageId={lostStageId}
          massSelection={massSelection}
        />
      </div>
    </div>
  );
};