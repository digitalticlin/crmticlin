
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
}

export const ColumnContent = ({
  columnId,
  leads,
  onOpenLeadDetail,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false
}: ColumnContentProps) => {
  return (
    <LeadsList 
      columnId={columnId}
      leads={leads}
      onOpenLeadDetail={onOpenLeadDetail}
      onOpenChat={onOpenChat}
      onMoveToWonLost={onMoveToWonLost}
      onReturnToFunnel={onReturnToFunnel}
      isWonLostView={isWonLostView}
    />
  );
};
