import { KanbanColumn as IKanbanColumn, KanbanLead } from "@/types/kanban";
import { ColumnHeader } from "./column/ColumnHeader";
import { ColumnContent } from "./column/ColumnContent";
import { ColumnColorBar } from "./column/ColumnColorBar";

interface KanbanColumnProps {
  column: IKanbanColumn;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate: (updatedColumn: IKanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  isWonLostView?: boolean;
  onReturnToFunnel?: (lead: KanbanLead) => void;
}

export const KanbanColumn = ({ 
  column, 
  onOpenLeadDetail, 
  onColumnUpdate,
  onColumnDelete,
  onOpenChat,
  onMoveToWonLost,
  isWonLostView = false,
  onReturnToFunnel
}: KanbanColumnProps) => {
  const columnColor = column.color || "#e0e0e0";
  
  return (
    <div 
      className="relative glass bg-glass-light dark:bg-glass-dark rounded-2xl border-none shadow-glass-lg overflow-hidden flex flex-col min-w-[18rem] h-[calc(100vh-220px)] transition-all backdrop-blur-xl"
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
