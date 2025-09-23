/**
 * 🎯 UNIFIED LEAD CARD
 *
 * Este componente substitui e unifica:
 * - LeadCard.tsx (para cliques)
 * - DndSortableLeadCard.tsx (para drag)
 *
 * Funciona com ou sem DnD, sem conflitos entre clique e drag.
 */

import React, { useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LeadCard } from './LeadCard';
import { KanbanLead } from '@/types/kanban';
import { MassSelectionCoordinatedReturn } from '@/hooks/useMassSelectionCoordinated';
import { DND_CONFIG } from '@/config/dndConfig';

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
  enableDnd = true,
  className
}) => {
  // Verificar se deve usar DnD
  const shouldUseDnd = enableDnd && (massSelection?.canDragWithSelection() ?? true);

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

  // Handlers memoizados para melhor performance
  const handleCardClick = useCallback(() => {
    if (!isDragging) {
      DND_CONFIG.debug.log('info', 'Card clicked', { leadId: lead.id, leadName: lead.name });
      onOpenLeadDetail(lead);
    }
  }, [isDragging, onOpenLeadDetail, lead]);

  const handleChatClick = useCallback(() => {
    if (!isDragging && onOpenChat) {
      DND_CONFIG.debug.log('info', 'Chat clicked', { leadId: lead.id });
      onOpenChat(lead);
    }
  }, [isDragging, onOpenChat, lead]);

  const handleMoveToWon = useCallback(() => {
    if (!isDragging && onMoveToWonLost) {
      DND_CONFIG.debug.log('info', 'Move to won', { leadId: lead.id });
      onMoveToWonLost(lead, "won");
    }
  }, [isDragging, onMoveToWonLost, lead]);

  const handleMoveToLost = useCallback(() => {
    if (!isDragging && onMoveToWonLost) {
      DND_CONFIG.debug.log('info', 'Move to lost', { leadId: lead.id });
      onMoveToWonLost(lead, "lost");
    }
  }, [isDragging, onMoveToWonLost, lead]);

  const handleReturnToFunnel = useCallback(() => {
    if (!isDragging && onReturnToFunnel) {
      DND_CONFIG.debug.log('info', 'Return to funnel', { leadId: lead.id });
      onReturnToFunnel(lead);
    }
  }, [isDragging, onReturnToFunnel, lead]);

  // Handler inteligente para detectar cliques em áreas bloqueadas
  const handleDragAreaClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Verificar se clicou em área que deve bloquear drag
    if (!DND_CONFIG.canStartDrag(target)) {
      DND_CONFIG.debug.log('debug', 'Drag bloqueado - área protegida', {
        target: target.className,
        leadId: lead.id
      });
      e.stopPropagation();
      return;
    }

    // Se chegou aqui, pode processar como clique normal
    handleCardClick();
  }, [handleCardClick, lead.id]);

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

  // Renderizar com DnD ativo - estrutura simples
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        zIndex: isDragging ? DND_CONFIG.zIndex.cardDragging : DND_CONFIG.zIndex.cardNormal
      }}
      className={`${className || ''} ${isDragging ? 'opacity-50' : ''} ${isSorting ? 'transition-transform' : ''} relative`}
      {...attributes}
      {...listeners}
    >
      {/* LeadCard renderizado normalmente */}
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

