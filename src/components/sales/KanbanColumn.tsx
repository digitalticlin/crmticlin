
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
  const columnColor = column.color || "#e5e7eb"; // Default color if none is set
  
  return (
    <div 
      className={`relative glass dark:glass-dark rounded-2xl ticlin-shadow transition-soft border-2 border-white/30 dark:border-white/10 shadow-lg flex flex-col min-w-[18rem] max-w-[19rem] h-[calc(100vh-240px)] mx-1`}
      style={{
        background: "rgba(255,255,255,0.15)",
        borderColor: columnColor
      }}
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

