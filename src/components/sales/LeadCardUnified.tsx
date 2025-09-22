/**
 * 🎯 UNIFIED LEAD CARD
 *
 * Este componente substitui e unifica:
 * - LeadCard.tsx (para cliques)
 * - DndSortableLeadCard.tsx (para drag)
 *
 * Funciona com ou sem DnD, sem conflitos entre clique e drag.
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LeadCard } from './LeadCard';
import { KanbanLead } from '@/types/kanban';
import { MassSelectionCoordinatedReturn } from '@/hooks/useMassSelectionCoordinated';

interface LeadCardUnifiedProps {
  lead: KanbanLead;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  wonStageId?: string;
  lostStageId?: string;
  massSelection?: MassSelectionCoordinatedReturn;
  enableDnd?: boolean;
  className?: string;
}

/**
 * Lead card unificado que funciona com ou sem DnD
 */
export const LeadCardUnified: React.FC<LeadCardUnifiedProps> = ({
  lead,
  onOpenLeadDetail,
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
  // Verificar se deve usar DnD
  const shouldUseDnd = enableDnd && massSelection?.canDragWithSelection();

  // Configurar sortable apenas se DnD estiver ativo
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
    disabled: !shouldUseDnd,
    data: {
      type: 'lead',
      leadId: lead.id,
      columnId: lead.columnId,
      leadName: lead.name
    }
  });

  const style = shouldUseDnd ? {
    transform: CSS.Transform.toString(transform),
    transition,
  } : {};

  // Handlers de clique que funcionam com ou sem DnD
  const handleCardClick = () => {
    if (!isDragging) {
      onOpenLeadDetail(lead);
    }
  };

  const handleChatClick = () => {
    if (!isDragging && onOpenChat) {
      onOpenChat(lead);
    }
  };

  const handleMoveToWon = () => {
    if (!isDragging && onMoveToWonLost) {
      onMoveToWonLost(lead, "won");
    }
  };

  const handleMoveToLost = () => {
    if (!isDragging && onMoveToWonLost) {
      onMoveToWonLost(lead, "lost");
    }
  };

  const handleReturnToFunnel = () => {
    if (!isDragging && onReturnToFunnel) {
      onReturnToFunnel(lead);
    }
  };

  // Se DnD não estiver ativo, renderizar card simples
  if (!shouldUseDnd) {
    return (
      <div className={className}>
        <LeadCard
          lead={lead}
          onClick={handleCardClick}
          onOpenChat={handleChatClick}
          onMoveToWon={handleMoveToWon}
          onMoveToLost={handleMoveToLost}
          onReturnToFunnel={handleReturnToFunnel}
          isWonLostView={isWonLostView}
          wonStageId={wonStageId}
          lostStageId={lostStageId}
          massSelection={massSelection}
        />
      </div>
    );
  }

  // Renderizar com DnD ativo
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
          onClick={handleCardClick}
          onOpenChat={handleChatClick}
          onMoveToWon={handleMoveToWon}
          onMoveToLost={handleMoveToLost}
          onReturnToFunnel={handleReturnToFunnel}
          isWonLostView={isWonLostView}
          wonStageId={wonStageId}
          lostStageId={lostStageId}
          massSelection={massSelection}
        />
      </div>

      {/* Indicador visual de drag */}
      {isDragging && (
        <div className="absolute top-2 right-2 z-40">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
            ⤴
          </div>
        </div>
      )}
    </div>
  );
};

