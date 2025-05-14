
import { KanbanLead } from "@/types/kanban";
import { LeadsList } from "./LeadsList";

interface ColumnContentProps {
  columnId: string;
  leads: KanbanLead[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  renderClone?: any;
}

export const ColumnContent = ({
  columnId,
  leads,
  onOpenLeadDetail,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false,
  renderClone,
  // NEW props para hover handlers
  onAnyCardMouseEnter,
  onAnyCardMouseLeave,
}: ColumnContentProps & {
  onAnyCardMouseEnter?: () => void;
  onAnyCardMouseLeave?: () => void;
}) => {
  return (
    <LeadsList 
      columnId={columnId}
      leads={leads}
      onOpenLeadDetail={onOpenLeadDetail}
      onOpenChat={onOpenChat}
      onMoveToWonLost={onMoveToWonLost}
      onReturnToFunnel={onReturnToFunnel}
      isWonLostView={isWonLostView}
      renderClone={renderClone}
      onAnyCardMouseEnter={onAnyCardMouseEnter}
      onAnyCardMouseLeave={onAnyCardMouseLeave}
    />
  );
};
