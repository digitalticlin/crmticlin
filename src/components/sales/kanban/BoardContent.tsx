import { ScrollArea } from "@/components/ui/scroll-area";
import { KanbanColumn as IKanbanColumn, KanbanLead } from "@/types/kanban";
import { KanbanColumn } from "../KanbanColumn";

interface BoardContentProps {
  columns: IKanbanColumn[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate: (updatedColumn: IKanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  isWonLostView?: boolean;
  onReturnToFunnel?: (lead: KanbanLead) => void;
}

export const BoardContent = ({
  columns,
  onOpenLeadDetail,
  onColumnUpdate,
  onColumnDelete,
  onOpenChat,
  onMoveToWonLost,
  isWonLostView = false,
  onReturnToFunnel
}: BoardContentProps) => {
  const visibleColumns = columns.filter(column => !column.isHidden);
  return (
    <ScrollArea className="w-full h-full">
      <div className="flex gap-6 pb-6 min-w-max h-full">
        {visibleColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onOpenLeadDetail={onOpenLeadDetail}
            onColumnUpdate={onColumnUpdate}
            onColumnDelete={onColumnDelete}
            onOpenChat={onOpenChat}
            onMoveToWonLost={onMoveToWonLost}
            isWonLostView={isWonLostView}
            onReturnToFunnel={onReturnToFunnel}
          />
        ))}
      </div>
    </ScrollArea>
  );
};
