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
  // Drag desabilitado durante modo de seleção em massa para evitar conflito
  const isSelectionMode = massSelection?.isSelectionMode || false;
  const shouldUseDnd = enableDnd && !isSelectionMode;

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

  // Handler que detecta área clicada e delega apropriadamente
  const handleCardClick = useCallback((e?: React.MouseEvent) => {
    if (isDragging) return;

    const target = e.target as Element;
    const wonButtonArea = target.closest('.won-button-area');
    const lostButtonArea = target.closest('.lost-button-area');
    const returnToFunnelArea = target.closest('.return-to-funnel-area');

    console.log('[LeadCardUnified] 🖱️ CLICK PROCESSADO:', {
      wonButtonArea: !!wonButtonArea,
      lostButtonArea: !!lostButtonArea,
      returnToFunnelArea: !!returnToFunnelArea,
      isSelectionMode: massSelection?.isSelectionMode,
      canSelect: massSelection?.canSelect?.()
    });

    // Chat removido - será processado pelo LeadCard diretamente

    if (wonButtonArea && onMoveToWonLost) {
      console.log('[LeadCardUnified] 🏆 Processando won click');
      onMoveToWonLost(lead, "won");
      return;
    }

    if (lostButtonArea && onMoveToWonLost) {
      console.log('[LeadCardUnified] 💥 Processando lost click');
      onMoveToWonLost(lead, "lost");
      return;
    }

    if (returnToFunnelArea && onReturnToFunnel) {
      console.log('[LeadCardUnified] 🔄 Processando return click');
      onReturnToFunnel(lead);
      return;
    }

    // 🎯 PRIORIDADE: Se massa selection está ativa, toggle seleção
    if (massSelection?.canSelect?.() && massSelection?.toggleLead) {
      console.log('[LeadCardUnified] 🎯 Modo seleção ativo - toggleando lead:', lead.name);
      massSelection.toggleLead(lead.id);
      return;
    }

    // Se não foi nenhum botão específico, abrir detalhes
    console.log('[LeadCardUnified] 📋 Abrindo detalhes do lead');
    onOpenLeadDetail(lead);
  }, [isDragging, onOpenLeadDetail, onMoveToWonLost, onReturnToFunnel, lead, massSelection]);

  const handleChatClick = useCallback(() => {
    if (!isDragging && onOpenChat) {
      DND_CONFIG.debug.log('info', 'Chat clicked', { leadId: lead.id });
      onOpenChat(lead);
    }
  }, [isDragging, onOpenChat, lead]);

  const handleMoveToWon = useCallback(() => {
    if (!isDragging && onMoveToWonLost) {
      console.log('[LeadCardUnified] 🏆 handleMoveToWon - delegando para onMoveToWonLost');
      DND_CONFIG.debug.log('info', 'Move to won', { leadId: lead.id });
      onMoveToWonLost(lead, "won");
    }
  }, [isDragging, onMoveToWonLost, lead]);

  const handleMoveToLost = useCallback(() => {
    if (!isDragging && onMoveToWonLost) {
      console.log('[LeadCardUnified] 💥 handleMoveToLost - delegando para onMoveToWonLost');
      DND_CONFIG.debug.log('info', 'Move to lost', { leadId: lead.id });
      onMoveToWonLost(lead, "lost");
    }
  }, [isDragging, onMoveToWonLost, lead]);

  const handleReturnToFunnel = useCallback(() => {
    if (!isDragging && onReturnToFunnel) {
      console.log('[LeadCardUnified] 🔄 handleReturnToFunnel - delegando para onReturnToFunnel');
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
          onClick={() => handleCardClick()}
          onOpenChat={onOpenChat} // Restaurado - chat funcionava perfeitamente
          onMoveToWon={handleMoveToWon} // Passar o handler real
          onMoveToLost={handleMoveToLost} // Passar o handler real
          onReturnToFunnel={handleReturnToFunnel} // Passar o handler real
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
      {...(shouldUseDnd ? listeners : {})}
      onPointerDown={(e) => {
        // Se DnD não está ativo (modo seleção), não fazer nada
        if (!shouldUseDnd) {
          return;
        }

        // Verificar se clicou em área protegida
        const target = e.target as HTMLElement;
        if (target.closest('[data-no-drag]') ||
            target.closest('.won-button-area') ||
            target.closest('.lost-button-area') ||
            target.closest('.chat-icon-area') ||
            target.closest('.return-to-funnel-area') ||
            target.closest('.selection-checkbox') ||
            target.closest('.lead-actions')) {
          e.stopPropagation();
          return;
        }
        // Deixar DnD prosseguir
        if (listeners?.onPointerDown) {
          listeners.onPointerDown(e);
        }
      }}
    >
      {/* LeadCard renderizado normalmente */}
      <LeadCard
        lead={lead}
        onClick={() => handleCardClick()}
        onOpenChat={onOpenChat} // Restaurado - chat funcionava perfeitamente
        onMoveToWon={handleMoveToWon} // Passar o handler real
        onMoveToLost={handleMoveToLost} // Passar o handler real
        onReturnToFunnel={handleReturnToFunnel} // Passar o handler real
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

