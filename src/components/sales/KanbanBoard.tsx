
import { DragDropContext } from "react-beautiful-dnd";
import { KanbanColumn as IKanbanColumn, KanbanLead } from "@/types/kanban";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  columns: IKanbanColumn[];
  onColumnsChange: (newColumns: IKanbanColumn[]) => void;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate: (updatedColumn: IKanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
}

export const KanbanBoard = ({
  columns,
  onColumnsChange,
  onOpenLeadDetail,
  onColumnUpdate,
  onColumnDelete,
  onOpenChat,
  onMoveToWonLost
}: KanbanBoardProps) => {
  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    // If moving within the same column
    if (source.droppableId === destination.droppableId) {
      const newLeads = Array.from(sourceColumn.leads);
      const [removed] = newLeads.splice(source.index, 1);
      newLeads.splice(destination.index, 0, removed);

      const newColumns = columns.map(col => {
        if (col.id === source.droppableId) {
          return {
            ...col,
            leads: newLeads,
          };
        }
        return col;
      });

      onColumnsChange(newColumns);
    } else {
      // Moving from one column to another
      const sourceLeads = Array.from(sourceColumn.leads);
      const [removed] = sourceLeads.splice(source.index, 1);
      const destLeads = Array.from(destColumn.leads);
      destLeads.splice(destination.index, 0, removed);

      const newColumns = columns.map(col => {
        if (col.id === source.droppableId) {
          return {
            ...col,
            leads: sourceLeads,
          };
        }
        if (col.id === destination.droppableId) {
          return {
            ...col,
            leads: destLeads,
          };
        }
        return col;
      });

      onColumnsChange(newColumns);
    }
  };

  // Filter out hidden columns (GANHO and PERDIDO) for main display
  const visibleColumns = columns.filter(column => !column.isHidden);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-6">
        {visibleColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onOpenLeadDetail={onOpenLeadDetail}
            onColumnUpdate={onColumnUpdate}
            onColumnDelete={onColumnDelete}
            onOpenChat={onOpenChat}
            onMoveToWonLost={onMoveToWonLost}
          />
        ))}
      </div>
    </DragDropContext>
  );
};
