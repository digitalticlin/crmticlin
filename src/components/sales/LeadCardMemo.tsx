
import React from "react";
import { KanbanLead } from "@/types/kanban";
import { DraggableProvided } from "react-beautiful-dnd";
import { LeadCard } from "./LeadCard";

interface LeadCardMemoProps {
  lead: KanbanLead;
  provided: DraggableProvided;
  onClick: () => void;
  onOpenChat?: () => void;
  onMoveToWon?: () => void;
  onMoveToLost?: () => void;
  onReturnToFunnel?: () => void;
  isWonLostView?: boolean;
  isDragging?: boolean;
  isClone?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  wonStageId?: string;
  lostStageId?: string;
}

// Memoização inteligente do LeadCard - só re-renderiza se props relevantes mudarem
export const LeadCardMemo = React.memo<LeadCardMemoProps>(
  LeadCard,
  (prevProps, nextProps) => {
    // Comparação otimizada focada apenas em mudanças que afetam a renderização
    const leadChanged = 
      prevProps.lead.id !== nextProps.lead.id ||
      prevProps.lead.name !== nextProps.lead.name ||
      prevProps.lead.lastMessage !== nextProps.lead.lastMessage ||
      prevProps.lead.last_message !== nextProps.lead.last_message ||
      prevProps.lead.purchaseValue !== nextProps.lead.purchaseValue ||
      prevProps.lead.purchase_value !== nextProps.lead.purchase_value ||
      prevProps.lead.unreadCount !== nextProps.lead.unreadCount ||
      prevProps.lead.unread_count !== nextProps.lead.unread_count ||
      prevProps.lead.columnId !== nextProps.lead.columnId ||
      prevProps.lead.assignedUser !== nextProps.lead.assignedUser ||
      prevProps.lead.owner_id !== nextProps.lead.owner_id ||
      prevProps.lead.phone !== nextProps.lead.phone;

    const tagsChanged = 
      prevProps.lead.tags?.length !== nextProps.lead.tags?.length ||
      prevProps.lead.tags?.some((tag, index) => 
        tag.id !== nextProps.lead.tags?.[index]?.id ||
        tag.name !== nextProps.lead.tags?.[index]?.name ||
        tag.color !== nextProps.lead.tags?.[index]?.color
      );

    const stateChanged =
      prevProps.isDragging !== nextProps.isDragging ||
      prevProps.isWonLostView !== nextProps.isWonLostView ||
      prevProps.wonStageId !== nextProps.wonStageId ||
      prevProps.lostStageId !== nextProps.lostStageId;

    // Só re-renderizar se houver mudanças relevantes
    const shouldRerender = leadChanged || tagsChanged || stateChanged;

    if (shouldRerender) {
      console.log('[LeadCardMemo] 🔄 Re-renderizando lead:', nextProps.lead.name, {
        leadChanged,
        tagsChanged, 
        stateChanged
      });
    }

    return !shouldRerender; // true = não re-renderizar, false = re-renderizar
  }
);

LeadCardMemo.displayName = 'LeadCardMemo';
