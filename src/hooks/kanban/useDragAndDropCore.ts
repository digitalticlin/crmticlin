
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
    setShowDropZones(true);
  };

  const validateDragResult = (result: DropResult) => {
    const { destination, source } = result;
    
    if (!destination) return false;
    
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return false;
    }
    
    return true;
  };

  const findColumns = (result: DropResult) => {
    const { source, destination } = result;
    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination!.droppableId);
    
    return { sourceColumn, destColumn };
  };

  const findLead = (sourceColumn: KanbanColumn, leadId: string) => {
    return sourceColumn.leads.find(lead => lead.id === leadId);
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
