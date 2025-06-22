import { useState } from "react";
import { DropResult } from "react-beautiful-dnd";
import { KanbanColumn, KanbanLead } from "@/types/kanban";

interface UseDragAndDropCoreProps {
  columns: KanbanColumn[];
  onColumnsChange: (newColumns: KanbanColumn[]) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  isWonLostView?: boolean;
}

export const useDragAndDropCore = ({ 
  columns, 
  onColumnsChange, 
  onMoveToWonLost,
  isWonLostView = false
}: UseDragAndDropCoreProps) => {
  const [showDropZones, setShowDropZones] = useState(false);

  const onDragStart = () => {
    try {
      setShowDropZones(true);
    } catch (error) {
      console.error('[useDragAndDropCore] ❌ Erro ao iniciar drag:', error);
    }
  };

  const validateDragResult = (result: DropResult) => {
    try {
      if (!result) {
        console.error('[useDragAndDropCore] ❌ Resultado de drag inválido');
        return false;
      }
      
      const { destination, source } = result;
      
      if (!destination) {
        // Não é um erro, apenas um drop fora de área válida
        return false;
      }
      
      if (destination.droppableId === source.droppableId && destination.index === source.index) {
        // Não é um erro, apenas um drop na mesma posição
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[useDragAndDropCore] ❌ Erro ao validar resultado de drag:', error);
      return false;
    }
  };

  const findColumns = (result: DropResult) => {
    try {
      const { source, destination } = result;
      
      if (!source || !destination) {
        console.error('[useDragAndDropCore] ❌ Origem ou destino inválidos');
        return { sourceColumn: null, destColumn: null };
      }
      
      const sourceColumn = columns.find(col => col.id === source.droppableId);
      const destColumn = columns.find(col => col.id === destination.droppableId);
      
      if (!sourceColumn || !destColumn) {
        console.error('[useDragAndDropCore] ❌ Coluna de origem ou destino não encontrada', {
          sourceId: source.droppableId,
          destId: destination.droppableId,
          availableColumns: columns.map(c => c.id)
        });
      }
      
      return { sourceColumn, destColumn };
    } catch (error) {
      console.error('[useDragAndDropCore] ❌ Erro ao encontrar colunas:', error);
      return { sourceColumn: null, destColumn: null };
    }
  };

  const findLead = (sourceColumn: KanbanColumn, leadId: string) => {
    try {
      if (!sourceColumn || !sourceColumn.leads) {
        console.error('[useDragAndDropCore] ❌ Coluna de origem inválida');
        return null;
      }
      
      if (!leadId) {
        console.error('[useDragAndDropCore] ❌ ID do lead inválido');
        return null;
      }
      
      const lead = sourceColumn.leads.find(lead => lead.id === leadId);
      
      if (!lead) {
        console.error('[useDragAndDropCore] ❌ Lead não encontrado na coluna', {
          leadId,
          columnId: sourceColumn.id,
          leadsInColumn: sourceColumn.leads.map(l => l.id)
        });
      }
      
      return lead;
    } catch (error) {
      console.error('[useDragAndDropCore] ❌ Erro ao encontrar lead:', error);
      return null;
    }
  };

  return {
    showDropZones,
    setShowDropZones,
    onDragStart,
    validateDragResult,
    findColumns,
    findLead
  };
};
