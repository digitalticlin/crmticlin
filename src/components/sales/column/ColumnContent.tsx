
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
  onAnyCardMouseEnter?: () => void;
  onAnyCardMouseLeave?: () => void;
  wonStageId?: string;
  lostStageId?: string;
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
  onAnyCardMouseEnter,
  onAnyCardMouseLeave,
  wonStageId,
  lostStageId
}: ColumnContentProps) => {
  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
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
        wonStageId={wonStageId}
        lostStageId={lostStageId}
      />
    </div>
  );
};
