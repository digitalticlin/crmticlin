
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
  renderClone?: any;
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
  renderClone,
  wonStageId,
  lostStageId
}: BoardContentProps) => {
  return (
    <div className="flex-1 h-full overflow-x-auto overflow-y-hidden kanban-scrollbar">
      <div className="flex h-full min-w-max gap-6 p-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {columns.map((column) => (
          <KanbanColumnComponent
            key={column.id}
            column={column}
            onOpenLeadDetail={onOpenLeadDetail}
            onUpdate={onColumnUpdate}
            onDelete={onColumnDelete}
            onOpenChat={onOpenChat}
            onMoveToWonLost={onMoveToWonLost}
            onReturnToFunnel={onReturnToFunnel}
            isWonLostView={isWonLostView}
            renderClone={renderClone}
            wonStageId={wonStageId}
            lostStageId={lostStageId}
          />
        ))}
      </div>
    </div>
  );
};
