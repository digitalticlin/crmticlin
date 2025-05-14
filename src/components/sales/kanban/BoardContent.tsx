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
      <div className="flex gap-8 md:gap-10 px-2 md:px-8 pb-10 md:pb-12 min-w-max justify-center">
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
