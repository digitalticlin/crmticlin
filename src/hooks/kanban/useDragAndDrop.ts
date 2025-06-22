import { DropResult } from "react-beautiful-dnd";
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { useDragAndDropCore } from "./useDragAndDropCore";
import { useDragAndDropOperations } from "./useDragAndDropOperations";

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
  // Verificar se os módulos necessários estão disponíveis
  if (!useDragAndDropCore || !useDragAndDropOperations) {
    console.error('[useDragAndDrop] ❌ Módulos de drag and drop não encontrados');
    // Retornar implementação mínima para evitar erros
    return {
      showDropZones: false,
      onDragStart: () => {},
      onDragEnd: () => {}
    };
  }

  const {
    showDropZones,
    setShowDropZones,
    onDragStart,
    validateDragResult,
    findColumns,
    findLead
  } = useDragAndDropCore({ columns, onColumnsChange, onMoveToWonLost, isWonLostView });

  const {
    handleSameColumnReorder,
    handleCrossColumnMove
  } = useDragAndDropOperations({ columns, onColumnsChange, onMoveToWonLost, isWonLostView });

  const onDragEnd = async (result: DropResult) => {
    try {
      setShowDropZones(false);

      if (!validateDragResult(result)) return;

      const { destination, source, draggableId } = result;
      const { sourceColumn, destColumn } = findColumns(result);

      if (!sourceColumn || !destColumn) return;

      const lead = findLead(sourceColumn, draggableId);
      if (!lead) return;

      const previousColumns = columns;

      if (source.droppableId === destination!.droppableId) {
        await handleSameColumnReorder(sourceColumn, source.index, destination!.index, previousColumns);
      } else {
        await handleCrossColumnMove(lead, sourceColumn, destColumn, source.index, destination!.index, previousColumns);
      }
    } catch (error) {
      console.error('[useDragAndDrop] ❌ Erro durante operação de drag and drop:', error);
      // Não propagar o erro para evitar quebrar a UI
    }
  };

  return {
    showDropZones,
    onDragStart,
    onDragEnd
  };
};
