
import { useState, useRef, useEffect } from "react";
import { DropResult } from "react-beautiful-dnd";
import { KanbanColumn, KanbanLead, FIXED_COLUMN_IDS } from "@/types/kanban";

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
  const [isDragging, setIsDragging] = useState(false);
  const [showDropZones, setShowDropZones] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const dropZoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (dropZoneTimeoutRef.current) {
        clearTimeout(dropZoneTimeoutRef.current);
      }
    };
  }, []);

  const onDragStart = (start: any) => {
    setDraggedItemId(start.draggableId);
    setIsDragging(true);
    
    // Play a subtle sound effect when drag starts
    try {
      const audio = new Audio();
      audio.volume = 0.2; // Keep the sound subtle
      audio.play().catch(() => {}); // Ignore errors if browser blocks autoplay
    } catch (e) {
      // Ignore audio errors
    }
    
    if (!isWonLostView) {
      // Show drop zones quickly but not instantly to reduce flickering
      dropZoneTimeoutRef.current = setTimeout(() => {
        setShowDropZones(true);
      }, 150);
    }
    
    // Add a class to the body to indicate dragging state
    document.body.classList.add('is-dragging');
  };

  const onDragEnd = (result: DropResult) => {
    setIsDragging(false);
    setShowDropZones(false);
    setDraggedItemId(null);
    
    document.body.classList.remove('is-dragging');
    
    if (dropZoneTimeoutRef.current) {
      clearTimeout(dropZoneTimeoutRef.current);
      dropZoneTimeoutRef.current = null;
    }
    
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // Special handling for drop zones
    if (destination.droppableId === 'drop-zone-won' || destination.droppableId === 'drop-zone-lost') {
      // Play a success sound
      try {
        const audio = new Audio();
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (e) {
        // Ignore audio errors
      }
      
      // Find the lead that was dragged
      const sourceColumn = columns.find(col => col.id === source.droppableId);
      if (!sourceColumn) return;
      
      const draggedLead = sourceColumn.leads[source.index];
      if (!draggedLead) return;
      
      const status = destination.droppableId === 'drop-zone-won' ? 'won' : 'lost';
      if (onMoveToWonLost) {
        onMoveToWonLost(draggedLead, status);
      }
      return;
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the source and destination columns
    const sourceColumnId = source.droppableId;
    const destColumnId = destination.droppableId;
    
    const sourceColumn = columns.find(col => col.id === sourceColumnId);
    const destColumn = columns.find(col => col.id === destColumnId);

    // Safety check to prevent errors
    if (!sourceColumn || !destColumn) {
      console.error(`Column not found: source=${sourceColumnId}, dest=${destColumnId}`);
      return;
    }

    try {
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
        
        // Update the lead with its new column ID
        const movedLead = {
          ...removed,
          columnId: destColumn.id
        };
        
        const destLeads = Array.from(destColumn.leads);
        destLeads.splice(destination.index, 0, movedLead);

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
        
        // Play a sound when moved between columns
        try {
          const audio = new Audio();
          audio.volume = 0.2;
          audio.play().catch(() => {});
        } catch (e) {
          // Ignore audio errors
        }
      }
    } catch (error) {
      console.error("Error during drag and drop operation:", error);
    }
  };

  return {
    isDragging,
    showDropZones,
    draggedItemId,
    onDragStart,
    onDragEnd
  };
};
