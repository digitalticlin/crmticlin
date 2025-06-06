
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
      className="flex flex-col h-full w-80 bg-white/20 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:bg-white/25"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderImage: 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2)) 1',
      }}
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
