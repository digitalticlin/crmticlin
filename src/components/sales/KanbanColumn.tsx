
import { useState } from "react";
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
      className="relative bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl border-0 shadow-lg flex flex-col min-w-[290px] max-w-[320px] w-full md:h-[72vh] h-[540px] transition-all duration-200 hover:shadow-xl"
      style={{
        boxShadow: "0 8px 32px 0 rgba(31,38,135,0.1)",
        marginBottom: 0,
        zIndex: 10,
        overflow: isAnyCardHovered ? "visible" : "hidden"
      }}
    >
      <ColumnColorBar color={columnColor} />
      <ColumnHeader
        column={column}
        onColumnUpdate={onColumnUpdate}
        onColumnDelete={onColumnDelete}
      />
      <div className="flex-1 overflow-y-auto px-2 pb-2 pt-4">
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
