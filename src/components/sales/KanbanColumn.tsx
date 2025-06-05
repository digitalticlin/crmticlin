
import { useState } from "react";
import { KanbanColumn as IKanbanColumn, KanbanLead } from "@/types/kanban";
import { ColumnHeader } from "./column/ColumnHeader";
import { ColumnContent } from "./column/ColumnContent";

interface KanbanColumnProps {
  column: IKanbanColumn;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate: (updatedColumn: IKanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  isWonLostView?: boolean;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  renderClone?: any;
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
  renderClone
}: KanbanColumnProps) => {
  const columnColor = column.color || "#e0e0e0";
  const [isAnyCardHovered, setIsAnyCardHovered] = useState(false);

  return (
    <div
      className="relative bg-white/15 backdrop-blur-xl border border-white/25 rounded-3xl flex flex-col min-w-[320px] max-w-[350px] w-full h-[75vh] transition-all duration-300 hover:shadow-2xl hover:bg-white/20 group"
      style={{
        overflow: isAnyCardHovered ? "visible" : "hidden"
      }}
    >
      {/* Barra de Cor no Topo */}
      <div 
        className="h-1.5 rounded-t-3xl"
        style={{ backgroundColor: columnColor }}
      />
      
      <ColumnHeader
        column={column}
        onColumnUpdate={onColumnUpdate}
        onColumnDelete={onColumnDelete}
      />
      
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 kanban-column-scrollbar">
        <ColumnContent
          columnId={column.id}
          leads={column.leads}
          onOpenLeadDetail={onOpenLeadDetail}
          onOpenChat={onOpenChat}
          onMoveToWonLost={!isWonLostView ? onMoveToWonLost : undefined}
          onReturnToFunnel={isWonLostView ? onReturnToFunnel : undefined}
          isWonLostView={isWonLostView}
          renderClone={renderClone}
          onAnyCardMouseEnter={() => setIsAnyCardHovered(true)}
          onAnyCardMouseLeave={() => setIsAnyCardHovered(false)}
        />
      </div>
    </div>
  );
};
