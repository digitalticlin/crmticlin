
import { useState, useCallback } from "react";
import { DropResult } from "react-beautiful-dnd";
import { KanbanColumn, KanbanLead } from "@/types/kanban";

interface UseDragAndDropOperationsProps {
  columns: KanbanColumn[];
  onColumnsChange: (newColumns: KanbanColumn[]) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  isWonLostView?: boolean;
}

export const useDragAndDropOperations = ({ 
  columns, 
  onColumnsChange, 
  onMoveToWonLost,
  isWonLostView = false
}: UseDragAndDropOperationsProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDragStart = useCallback(() => {
    console.log('[DragAndDropOperations] 🎯 Drag iniciado');
    setIsDragging(true);
  }, []);

  const onDragEnd = useCallback(async (result: DropResult) => {
    try {
      console.log('[DragAndDropOperations] 🎯 Processando drag end:', result);
      setIsDragging(false);

      if (!result.destination || !result.source) {
        console.log('[DragAndDropOperations] ⚠️ Drag cancelado - sem destino válido');
        return;
      }

      if (result.destination.droppableId === result.source.droppableId && 
          result.destination.index === result.source.index) {
        console.log('[DragAndDropOperations] ⚠️ Drag cancelado - mesma posição');
        return;
      }

      // Validar colunas
      if (!Array.isArray(columns) || columns.length === 0) {
        console.error('[DragAndDropOperations] ❌ Colunas inválidas');
        return;
      }

      const sourceColumn = columns.find(col => col.id === result.source.droppableId);
      const destColumn = columns.find(col => col.id === result.destination!.droppableId);

      if (!sourceColumn || !destColumn) {
        console.error('[DragAndDropOperations] ❌ Coluna não encontrada', {
          sourceId: result.source.droppableId,
          destId: result.destination.droppableId
        });
        return;
      }

      const draggedLead = sourceColumn.leads[result.source.index];
      if (!draggedLead) {
        console.error('[DragAndDropOperations] ❌ Lead não encontrado');
        return;
      }

      // Reordenar na mesma coluna
      if (result.source.droppableId === result.destination.droppableId) {
        const newLeads = Array.from(sourceColumn.leads);
        const [removed] = newLeads.splice(result.source.index, 1);
        newLeads.splice(result.destination.index, 0, removed);

        const newColumns = columns.map(col => 
          col.id === sourceColumn.id 
            ? { ...col, leads: newLeads }
            : col
        );

        onColumnsChange(newColumns);
        return;
      }

      // Mover entre colunas
      const sourceLeads = Array.from(sourceColumn.leads);
      const destLeads = Array.from(destColumn.leads);
      const [removed] = sourceLeads.splice(result.source.index, 1);
      
      // Atualizar columnId do lead
      const updatedLead = { ...removed, columnId: destColumn.id };
      destLeads.splice(result.destination.index, 0, updatedLead);

      const newColumns = columns.map(col => {
        if (col.id === sourceColumn.id) {
          return { ...col, leads: sourceLeads };
        }
        if (col.id === destColumn.id) {
          return { ...col, leads: destLeads };
        }
        return col;
      });

      onColumnsChange(newColumns);

      console.log('[DragAndDropOperations] ✅ Drag completado com sucesso');

    } catch (error) {
      console.error('[DragAndDropOperations] ❌ Erro durante drag and drop:', error);
      setIsDragging(false);
    }
  }, [columns, onColumnsChange]);

  return {
    isDragging,
    onDragStart,
    onDragEnd
  };
};
