
import { useCallback } from "react";
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
      const element = document.querySelector(`[data-rbd-draggable-id="${start.draggableId}"]`);
      const rect = element?.getBoundingClientRect();

      const lastMouse = (window as any).__lastMouse as { x: number; y: number } | undefined;
      // Posição inicial do clone: canto superior esquerdo do card
      const initialPosition = rect
        ? { x: rect.left, y: rect.top }
        : { x: 30, y: 140 };

      // Offset inicial: ponto exato onde o usuário clicou dentro do card
      const initialOffset = rect && lastMouse
        ? { x: lastMouse.x - rect.left, y: lastMouse.y - rect.top }
        : undefined;

      const size = rect
        ? { width: Math.round(rect.width), height: Math.round(rect.height) }
        : { width: 320, height: 120 };

      showClone(draggedLead, initialPosition, size, initialOffset);
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
