
import { KanbanColumn as IKanbanColumn, KanbanLead } from "@/types/kanban";
import { KanbanColumn } from "../KanbanColumn";

interface BoardContentProps {
  columns: IKanbanColumn[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate: (updatedColumn: IKanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  isWonLostView?: boolean;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  renderClone?: any; // add renderClone to propagate to LeadsList
}

export const BoardContent = ({
  columns,
  onOpenLeadDetail,
  onColumnUpdate,
  onColumnDelete,
  onOpenChat,
  onMoveToWonLost,
  isWonLostView = false,
  onReturnToFunnel,
  renderClone
}: BoardContentProps) => {
  const visibleColumns = columns.filter(column => !column.isHidden);

  // Adiciona drag-to-scroll horizontal
  // (mouse down para arrastar o board inteiro)
  let isDragging = false;
  let startX = 0;
  let scrollLeft = 0;

  const mouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    isDragging = true;
    startX = e.pageX - (e.currentTarget.scrollLeft ?? 0);
    scrollLeft = e.currentTarget.scrollLeft;
    e.currentTarget.classList.add("cursor-grabbing");
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseup", mouseUp);
  };
  const mouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const board = document.getElementById("kanban-board-scroll");
    if (!board) return;
    board.scrollLeft = scrollLeft - (startX - e.pageX);
  };
  const mouseUp = (e: MouseEvent) => {
    isDragging = false;
    const board = document.getElementById("kanban-board-scroll");
    if (board) board.classList.remove("cursor-grabbing");
    window.removeEventListener("mousemove", mouseMove);
    window.removeEventListener("mouseup", mouseUp);
  };

  return (
    <div
      id="kanban-board-scroll"
      className="w-full h-full overflow-x-auto flex"
      style={{ WebkitOverflowScrolling: "touch", cursor: "grab" }}
      onMouseDown={mouseDown}
    >
      <div className="flex gap-8 md:gap-10 px-2 md:px-8 pb-10 md:pb-12 min-w-max justify-center w-full">
        {visibleColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onOpenLeadDetail={onOpenLeadDetail}
            onColumnUpdate={onColumnUpdate}
            onColumnDelete={onColumnDelete}
            onOpenChat={onOpenChat}
            onMoveToWonLost={onMoveToWonLost}
            isWonLostView={isWonLostView}
            onReturnToFunnel={onReturnToFunnel}
            renderClone={renderClone}
          />
        ))}
      </div>
    </div>
  );
};
