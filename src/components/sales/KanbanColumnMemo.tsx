
import React from "react";
import { KanbanColumn as KanbanColumnType, KanbanLead } from "@/types/kanban";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanColumnMemoProps {
  column: KanbanColumnType;
  index: number;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onUpdateColumn?: (column: KanbanColumnType) => void;
  onDeleteColumn?: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  wonStageId?: string;
  lostStageId?: string;
}

// Memoização inteligente da KanbanColumn - evita re-renders desnecessários
export const KanbanColumnMemo = React.memo<KanbanColumnMemoProps>(
  KanbanColumn,
  (prevProps, nextProps) => {
    // Verificar se a coluna em si mudou
    const columnChanged = 
      prevProps.column.id !== nextProps.column.id ||
      prevProps.column.title !== nextProps.column.title ||
      prevProps.column.color !== nextProps.column.color ||
      prevProps.column.isFixed !== nextProps.column.isFixed ||
      prevProps.column.isHidden !== nextProps.column.isHidden;

    // Verificar se os leads mudaram (quantidade ou conteúdo)
    const leadsChanged = 
      prevProps.column.leads.length !== nextProps.column.leads.length ||
      prevProps.column.leads.some((lead, index) => {
        const nextLead = nextProps.column.leads[index];
        if (!nextLead) return true;
        
        return (
          lead.id !== nextLead.id ||
          lead.name !== nextLead.name ||
          lead.columnId !== nextLead.columnId ||
          lead.lastMessage !== nextLead.lastMessage ||
          lead.last_message !== nextLead.last_message ||
          lead.purchaseValue !== nextLead.purchaseValue ||
          lead.purchase_value !== nextLead.purchase_value ||
          lead.unreadCount !== nextLead.unreadCount ||
          lead.unread_count !== nextLead.unread_count ||
          lead.assignedUser !== nextLead.assignedUser ||
          lead.owner_id !== nextLead.owner_id
        );
      });

    // Verificar mudanças de estado
    const stateChanged = 
      prevProps.isWonLostView !== nextProps.isWonLostView ||
      prevProps.wonStageId !== nextProps.wonStageId ||
      prevProps.lostStageId !== nextProps.lostStageId ||
      prevProps.index !== nextProps.index;

    const shouldRerender = columnChanged || leadsChanged || stateChanged;

    if (shouldRerender) {
      console.log('[KanbanColumnMemo] 🔄 Re-renderizando coluna:', nextProps.column.title, {
        columnChanged,
        leadsChanged,
        stateChanged,
        leadsCount: nextProps.column.leads.length
      });
    }

    return !shouldRerender;
  }
);

KanbanColumnMemo.displayName = 'KanbanColumnMemo';
