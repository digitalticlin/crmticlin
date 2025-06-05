
import { useState } from "react";
import { KanbanColumn as IKanbanColumn, KanbanLead } from "@/types/kanban";
import { ColumnHeader } from "./column/ColumnHeader";
import { ColumnContent } from "./column/ColumnContent";
import { ColumnColorBar } from "./column/ColumnColorBar";

interface KanbanColumnProps {
  column: IKanbanColumn;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onUpdate?: (updatedColumn: IKanbanColumn) => void;
  onDelete?: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  renderClone?: any;
  onAnyCardMouseEnter?: () => void;
  onAnyCardMouseLeave?: () => void;
  wonStageId?: string;
  lostStageId?: string;
}

export const KanbanColumn = ({
  column,
  onOpenLeadDetail,
  onUpdate,
  onDelete,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false,
  renderClone,
  onAnyCardMouseEnter,
  onAnyCardMouseLeave,
  wonStageId,
  lostStageId
}: KanbanColumnProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleUpdate = (field: keyof IKanbanColumn, value: any) => {
    if (onUpdate) {
      onUpdate({ ...column, [field]: value });
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(column.id);
    }
  };

  if (column.isHidden) {
    return null;
  }

  return (
    <div
      className="flex flex-col min-h-full w-80 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-lg border border-white/30 rounded-2xl shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ColumnColorBar color={column.color} />
      
      <ColumnHeader
        column={column}
        isHovered={isHovered}
        canEdit={!column.isFixed && !isWonLostView}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />

      <ColumnContent
        columnId={column.id}
        leads={column.leads}
        onOpenLeadDetail={onOpenLeadDetail}
        onOpenChat={onOpenChat}
        onMoveToWonLost={onMoveToWonLost}
        onReturnToFunnel={onReturnToFunnel}
        isWonLostView={isWonLostView}
        renderClone={renderClone}
        onAnyCardMouseEnter={onAnyCardMouseEnter}
        onAnyCardMouseLeave={onAnyCardMouseLeave}
        wonStageId={wonStageId}
        lostStageId={lostStageId}
      />
    </div>
  );
};
