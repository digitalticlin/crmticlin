
import { DropResult } from "react-beautiful-dnd";
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { useDragAndDropSafe } from "./useDragAndDropSafe";

interface UseDragAndDropProps {
  columns: KanbanColumn[];
  onColumnsChange: (newColumns: KanbanColumn[]) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  isWonLostView?: boolean;
}

export const useDragAndDrop = ({ 
  columns, 
  onColumnsChange, 
  onMoveToWonLost,
  isWonLostView = false
}: UseDragAndDropProps) => {
  console.log('[useDragAndDrop] 🔄 Inicializando com colunas:', columns?.length || 0);

  // Usar implementação segura sempre
  const safeImplementation = useDragAndDropSafe({
    columns,
    onColumnsChange,
    onMoveToWonLost,
    isWonLostView
  });

  return {
    showDropZones: safeImplementation.isDragging,
    onDragStart: safeImplementation.onDragStart,
    onDragEnd: safeImplementation.onDragEnd
  };
};
