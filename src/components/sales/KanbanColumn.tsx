
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
  renderClone?: any; // add renderClone to propagate to ColumnContent
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

  return (
    <div
      className="relative glass bg-white/50 dark:bg-black/30 rounded-3xl border-none shadow-glass-lg overflow-hidden flex flex-col min-w-[300px] max-w-[350px] w-full md:h-[72vh] h-[540px]"
      style={{
        boxShadow: "0 8px 40px 0 rgba(31,38,135,0.13)",
        border: "1.5px solid rgba(255,255,255,0.15)",
        marginBottom: 0,
        zIndex: 10 // Garante que o portal clone possa passar acima
      }}
    >
      <ColumnColorBar color={columnColor} />
      <ColumnHeader
        column={column}
        onColumnUpdate={onColumnUpdate}
        onColumnDelete={onColumnDelete}
      />
      {/* Limite de altura, ativando scroll apenas no conteúdo dos cards */}
      <div className="flex-1 overflow-y-auto px-1 pb-1">
        <ColumnContent
          columnId={column.id}
          leads={column.leads}
          onOpenLeadDetail={onOpenLeadDetail}
          onOpenChat={onOpenChat}
          onMoveToWonLost={!isWonLostView ? onMoveToWonLost : undefined}
          onReturnToFunnel={isWonLostView ? onReturnToFunnel : undefined}
          isWonLostView={isWonLostView}
          renderClone={renderClone}
        />
      </div>
    </div>
  );
};
