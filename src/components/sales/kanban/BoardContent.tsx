
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { KanbanColumn as KanbanColumnComponent } from "@/components/sales/KanbanColumn";

interface BoardContentProps {
  columns: KanbanColumn[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate?: (updatedColumn: KanbanColumn) => void;
  onColumnDelete?: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  wonStageId?: string;
  lostStageId?: string;
}

export const BoardContent = ({
  columns,
  onOpenLeadDetail,
  onColumnUpdate,
  onColumnDelete,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false,
  wonStageId,
  lostStageId
}: BoardContentProps) => {
  return (
    <div className="flex-1 h-full overflow-hidden">
      <div className="flex h-full min-w-max gap-6 p-6 overflow-x-auto kanban-scrollbar" style={{ height: '100%' }}>
        {columns.map((column, index) => (
          <KanbanColumnComponent
            key={column.id}
            column={column}
            index={index}
            onOpenLeadDetail={onOpenLeadDetail}
            onUpdateColumn={onColumnUpdate}
            onDeleteColumn={onColumnDelete}
            onOpenChat={onOpenChat}
            onMoveToWonLost={onMoveToWonLost}
            onReturnToFunnel={onReturnToFunnel}
            isWonLostView={isWonLostView}
            wonStageId={wonStageId}
            lostStageId={lostStageId}
          />
        ))}
      </div>
    </div>
  );
};
