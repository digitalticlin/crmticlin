
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

  // Hook para drag and drop seguro
  const safeImplementation = useDragAndDropSafe({
    columns,
    onColumnsChange,
    onMoveToWonLost,
    isWonLostView
  });

  // Handler simplificado - apenas UI local
  const handleDragEnd = async (result: DropResult) => {
    try {
      console.log('[useDragAndDrop] 🎯 Processando drag end');
      
      // Atualizar a UI imediatamente
      await safeImplementation.onDragEnd(result);
      
      console.log('[useDragAndDrop] ✅ Drag completado com sucesso');
    } catch (error) {
      console.error('[useDragAndDrop] ❌ Erro no drag:', error);
    }
  };

  return {
    showDropZones: safeImplementation.isDragging,
    onDragStart: safeImplementation.onDragStart,
    onDragEnd: handleDragEnd
  };
};
