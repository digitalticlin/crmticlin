
import { useState, useCallback } from "react";
import { KanbanLead } from "@/types/kanban";

interface DragState {
  isDragging: boolean;
  draggedItem: KanbanLead | null;
  sourceColumn: string | null;
  targetColumn: string | null;
}

export const useDragState = () => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    sourceColumn: null,
    targetColumn: null
  });

  const startDrag = useCallback((item: KanbanLead, sourceColumn: string) => {
    console.log('[DragState] 🚀 Iniciando drag:', item.name, 'de', sourceColumn);
    setDragState({
      isDragging: true,
      draggedItem: item,
      sourceColumn,
      targetColumn: null
    });
  }, []);

  const updateDrag = useCallback((targetColumn: string) => {
    setDragState(prev => ({
      ...prev,
      targetColumn
    }));
  }, []);

  const endDrag = useCallback(() => {
    console.log('[DragState] 🏁 Finalizando drag');
    setDragState({
      isDragging: false,
      draggedItem: null,
      sourceColumn: null,
      targetColumn: null
    });
  }, []);

  const cancelDrag = useCallback(() => {
    console.log('[DragState] ❌ Cancelando drag');
    setDragState({
      isDragging: false,
      draggedItem: null,
      sourceColumn: null,
      targetColumn: null
    });
  }, []);

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag
  };
};
