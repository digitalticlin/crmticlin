
import { KanbanColumn as IKanbanColumn, KanbanLead, FIXED_COLUMN_IDS } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { ColumnHeader } from "./column/ColumnHeader";
import { LeadsList } from "./column/LeadsList";
import { getColumnColor } from "./column/columnColorUtils";

interface KanbanColumnProps {
  column: IKanbanColumn;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate: (updatedColumn: IKanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
}

export const KanbanColumn = ({ 
  column, 
  onOpenLeadDetail, 
  onColumnUpdate,
  onColumnDelete,
  onOpenChat,
  onMoveToWonLost
}: KanbanColumnProps) => {
  const isFixed = column.isFixed === true;
  
  // Updated column title display
  const displayTitle = column.id === FIXED_COLUMN_IDS.NEW_LEAD ? "Entrada de leads" : column.title;
  
  // Create a column with adjusted title for display
  const displayColumn = {
    ...column,
    title: displayTitle
  };
  
  const columnColorFn = () => getColumnColor(column.id, column.title);

  return (
    <div 
      key={column.id} 
      className={cn(
        "h-full flex flex-col backdrop-blur-xl border overflow-hidden rounded-lg",
        isFixed ? "border-gray-600/40 bg-black/40 shadow-xl" : "border-gray-600/40 bg-black/40 shadow-xl"
      )}
    >
      <ColumnHeader
        column={displayColumn}
        isFixed={isFixed}
        onColumnUpdate={onColumnUpdate}
        onColumnDelete={onColumnDelete}
        getColumnColor={columnColorFn}
      />
      
      <LeadsList
        columnId={column.id}
        leads={column.leads}
        onOpenLeadDetail={onOpenLeadDetail}
        onOpenChat={onOpenChat}
        onMoveToWonLost={onMoveToWonLost}
      />
    </div>
  );
};
