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

  console.log('[DndLeadCardWrapper] 🔧 RENDERIZANDO LEAD:', {
    leadId: lead.id,
    leadName: lead.name,
    enableDnd,
    isInSelectionMode,
    shouldDisableDnd,
    hasOnOpenChat: !!leadCardProps.onOpenChat,
    hasOnClick: !!leadCardProps.onClick
  });

  // Dados para o sistema DnD
  const dndData = {
    leadId: lead.id,
    columnId: lead.columnId,
    leadName: lead.name,
    type: 'lead'
  };

  // Se DnD desabilitado (incluindo modo seleção), renderizar LeadCard normal
  if (shouldDisableDnd) {
    console.log('[DndLeadCardWrapper] ⚠️ DnD DESABILITADO - renderizando LeadCard diretamente');
    return (
      <div className={className} onClick={() => {
        console.log('[DndLeadCardWrapper] 🖱️ CLIQUE DIRETO NA DIV (DnD desabilitado)');
        if (leadCardProps.onOpenChat) {
          console.log('[DndLeadCardWrapper] 💬 Executando onOpenChat direto...');
          leadCardProps.onOpenChat();
        } else if (leadCardProps.onClick) {
          console.log('[DndLeadCardWrapper] 👆 Executando onClick direto...');
          leadCardProps.onClick();
        }
      }}>
        <LeadCard lead={lead} {...leadCardProps} />
      </div>
    );
  }

  // Handler para clique simples que prioriza onOpenChat
  const handleClick = useCallback(() => {
    console.log('[DndLeadCardWrapper] 💬 CLIQUE RECEBIDO - PROCESSANDO:', { 
      leadId: lead.id, 
      leadName: lead.name,
      hasOnOpenChat: !!leadCardProps.onOpenChat,
      hasOnClick: !!leadCardProps.onClick,
      onOpenChatType: typeof leadCardProps.onOpenChat,
      onClickType: typeof leadCardProps.onClick
    });
    
    // Priorizar onOpenChat para abrir chat
    if (leadCardProps.onOpenChat) {
      console.log('[DndLeadCardWrapper] 🚀 EXECUTANDO onOpenChat...');
      try {
        leadCardProps.onOpenChat();
        console.log('[DndLeadCardWrapper] ✅ onOpenChat EXECUTADO COM SUCESSO');
      } catch (error) {
        console.error('[DndLeadCardWrapper] ❌ ERRO ao executar onOpenChat:', error);
      }
    } else if (leadCardProps.onClick) {
      console.log('[DndLeadCardWrapper] 🚀 EXECUTANDO onClick fallback...');
      try {
        leadCardProps.onClick();
        console.log('[DndLeadCardWrapper] ✅ onClick EXECUTADO COM SUCESSO');
      } catch (error) {
        console.error('[DndLeadCardWrapper] ❌ ERRO ao executar onClick:', error);
      }
    } else {
      console.error('[DndLeadCardWrapper] ❌ NEM onOpenChat NEM onClick EXISTEM!');
    }
  }, [lead.id, lead.name, leadCardProps.onOpenChat, leadCardProps.onClick]);

  return (
    <DndDraggableCard
      id={lead.id}
      data={dndData}
      className={className}
      onClick={handleClick}
    >
      <LeadCard lead={lead} {...leadCardProps} />
    </DndDraggableCard>
  );
};