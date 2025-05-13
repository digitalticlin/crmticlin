
import { KanbanColumn as IKanbanColumn, KanbanLead } from "@/types/kanban";
import { ColumnHeader } from "./column/ColumnHeader";
import { ColumnContent } from "./column/ColumnContent";
import { ColumnColorBar } from "./column/ColumnColorBar";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  column: IKanbanColumn;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate: (updatedColumn: IKanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  isWonLostView?: boolean;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isDragging?: boolean;
}

export const KanbanColumn = ({ 
  column, 
  onOpenLeadDetail, 
  onColumnUpdate,
  onColumnDelete,
  onOpenChat,
  onMoveToWonLost,
  isWonLostView = false,
  onReturnToFunnel,
  isDragging = false
}: KanbanColumnProps) => {
  const columnColor = column.color || "#e5e7eb"; // Default color if none is set
  
  return (
    <div 
      className={cn(
        "relative bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-lg",
        "border border-slate-200/20 shadow-xl overflow-hidden flex flex-col min-w-[18rem]",
        "h-[calc(100vh-220px)] transition-all duration-300",
        "hover:border-slate-300/30 dark:hover:border-slate-700/30",
        isDragging && "opacity-95"
      )}
    >
      {/* Colored bar at the top of the column */}
      <ColumnColorBar color={columnColor} />
      
      <ColumnHeader 
        column={column}
        onColumnUpdate={onColumnUpdate}
        onColumnDelete={onColumnDelete}
      />
      
      <ColumnContent 
        columnId={column.id}
        leads={column.leads}
        onOpenLeadDetail={onOpenLeadDetail}
        onOpenChat={onOpenChat}
        onMoveToWonLost={!isWonLostView ? onMoveToWonLost : undefined}
        onReturnToFunnel={isWonLostView ? onReturnToFunnel : undefined}
        isWonLostView={isWonLostView}
      />
    </div>
  );
};
