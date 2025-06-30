
import { useState, useCallback } from "react";
import { DropResult } from "react-beautiful-dnd";
import { KanbanColumn } from "@/types/kanban";
import { toast } from "sonner";
import { useDragState } from "./useDragState";
import { useDragOperations } from "./useDragOperations";
import { useDragClone } from "./useDragClone";

interface UseDragAndDropOptimizedProps {
  columns: KanbanColumn[];
  onColumnsChange: (newColumns: KanbanColumn[]) => void;
  onMoveToWonLost?: (lead: any, status: "won" | "lost") => void;
  isWonLostView?: boolean;
}

export const useDragAndDropOptimized = ({ 
  columns, 
  onColumnsChange, 
  onMoveToWonLost,
  isWonLostView = false
}: UseDragAndDropOptimizedProps) => {
  
  const { dragState, startDrag, endDrag, cancelDrag } = useDragState();
  const { reorderInSameColumn, moveBetweenColumns } = useDragOperations({
    columns,
    onColumnsChange
  });

  // Sistema de clone integrado
  const { cloneState, showClone, hideClone } = useDragClone();

  const onDragStart = useCallback((start: any) => {
    console.log('[DragDropOptimized] 🚀 FASE 2+3 - Drag iniciado com clone visual');
    
    // Encontrar o lead sendo arrastado
    const sourceColumn = columns.find(col => col.id === start.source.droppableId);
    const draggedLead = sourceColumn?.leads[start.source.index];
    
    if (draggedLead) {
      // Pegar posição inicial do mouse
      const rect = document.querySelector(`[data-rbd-draggable-id="${start.draggableId}"]`)?.getBoundingClientRect();
      const initialPosition = rect ? 
        { x: rect.left, y: rect.top } : 
        { x: 200, y: 200 };
      
      // Mostrar clone
      showClone(draggedLead, initialPosition);
    }
  }, [columns, showClone]);

  const onDragEnd = useCallback(async (result: DropResult) => {
    try {
      console.log('[DragDropOptimized] 🏁 FASE 2+3 - Drag finalizado:', result);
      
      // Ocultar clone imediatamente
      hideClone();
      
      // Validações básicas
      if (!result.destination || !result.source) {
        console.log('[DragDropOptimized] ⚠️ Drag cancelado - sem destino');
        cancelDrag();
        return;
      }

      if (result.destination.droppableId === result.source.droppableId && 
          result.destination.index === result.source.index) {
        console.log('[DragDropOptimized] ⚠️ Drag cancelado - mesma posição');
        cancelDrag();
        return;
      }

      // Validação de colunas
      const sourceColumn = columns.find(col => col.id === result.source.droppableId);
      const destColumn = columns.find(col => col.id === result.destination!.droppableId);

      if (!sourceColumn || !destColumn) {
        console.error('[DragDropOptimized] ❌ Coluna não encontrada');
        toast.error("Erro: etapa não encontrada");
        cancelDrag();
        return;
      }

      // Reordenação vs Movimento
      if (result.source.droppableId === result.destination.droppableId) {
        reorderInSameColumn(result, sourceColumn);
      } else {
        await moveBetweenColumns(result, sourceColumn, destColumn);
      }

      endDrag();

    } catch (error) {
      console.error('[DragDropOptimized] ❌ Erro durante drag:', error);
      toast.error("Erro durante operação de drag and drop");
      hideClone(); // Garantir que clone seja ocultado em caso de erro
      cancelDrag();
    }
  }, [columns, reorderInSameColumn, moveBetweenColumns, endDrag, cancelDrag, hideClone]);

  return {
    isDragging: dragState.isDragging,
    onDragStart,
    onDragEnd,
    cloneState // Expor estado do clone para uso no wrapper
  };
};
