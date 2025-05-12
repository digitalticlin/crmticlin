
import { KanbanColumn as IKanbanColumn, KanbanLead } from "@/types/kanban";
import { ColumnHeader } from "./column/ColumnHeader";
import { LeadsList } from "./column/LeadsList";
import { getColumnColorClass } from "@/lib/utils";

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
  const isFixed = column.isFixed === true;
  
  return (
    <div 
      className={`relative bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-lg border border-slate-200/20 shadow-xl overflow-hidden flex flex-col min-w-[18rem] h-[calc(100vh-220px)] ${getColumnColorClass(column.id)}`}
    >
      <ColumnHeader 
        column={column}
        onColumnUpdate={onColumnUpdate}
        onColumnDelete={onColumnDelete}
      />
      
      <LeadsList 
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
