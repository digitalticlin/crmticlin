import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import { KanbanColumn as IKanbanColumn, KanbanLead, FIXED_COLUMN_IDS } from "@/types/kanban";
import { KanbanColumn } from "./KanbanColumn";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useRef, useEffect } from "react";
import { CheckCircle, XCircle, Whatsapp } from "lucide-react";

interface KanbanBoardProps {
  columns: IKanbanColumn[];
  onColumnsChange: (newColumns: IKanbanColumn[]) => void;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate: (updatedColumn: IKanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
}

export const KanbanBoard = ({
  columns,
  onColumnsChange,
  onOpenLeadDetail,
  onColumnUpdate,
  onColumnDelete,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false
}: KanbanBoardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showDropZones, setShowDropZones] = useState(false);
  const dropZoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    return () => {
      if (dropZoneTimeoutRef.current) {
        clearTimeout(dropZoneTimeoutRef.current);
      }
    };
  }, []);

  const onDragStart = () => {
    setIsDragging(true);
    if (!isWonLostView) {
      dropZoneTimeoutRef.current = setTimeout(() => {
        setShowDropZones(true);
      }, 300);
    }
  };

  const onDragEnd = (result: DropResult) => {
    setIsDragging(false);
    setShowDropZones(false);
    
    if (dropZoneTimeoutRef.current) {
      clearTimeout(dropZoneTimeoutRef.current);
      dropZoneTimeoutRef.current = null;
    }
    
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // Special handling for drop zones
    if (destination.droppableId === 'drop-zone-won' || destination.droppableId === 'drop-zone-lost') {
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

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

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
    }
  };

  // Filter out hidden columns
  const visibleColumns = columns.filter(column => !column.isHidden);

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="relative w-full h-full flex flex-col">
        <ScrollArea className="w-full h-full">
          <div className="flex gap-4 pb-6 min-w-max h-full">
            {visibleColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onOpenLeadDetail={onOpenLeadDetail}
                onColumnUpdate={onColumnUpdate}
                onColumnDelete={onColumnDelete}
                onOpenChat={onOpenChat}
                onMoveToWonLost={onMoveToWonLost}
                isWonLostView={isWonLostView}
                onReturnToFunnel={onReturnToFunnel}
              />
            ))}
          </div>
        </ScrollArea>
        
        {/* Fixed Won/Lost drop zones at the bottom of the screen */}
        {!isWonLostView && (
          <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-6 z-50 px-6">
            {/* Won drop zone */}
            <Droppable droppableId="drop-zone-won">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`bg-green-500/20 backdrop-blur-lg border-2 border-green-500 rounded-lg p-4 w-full max-w-xs h-24 flex items-center justify-center transition-all ${snapshot.isDraggingOver ? 'bg-green-500/40 scale-105' : ''}`}
                >
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-1" />
                    <p className="font-medium text-green-700 dark:text-green-300">GANHO</p>
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

            {/* Lost drop zone */}
            <Droppable droppableId="drop-zone-lost">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`bg-red-500/20 backdrop-blur-lg border-2 border-red-500 rounded-lg p-4 w-full max-w-xs h-24 flex items-center justify-center transition-all ${snapshot.isDraggingOver ? 'bg-red-500/40 scale-105' : ''}`}
                >
                  <div className="text-center">
                    <XCircle className="h-8 w-8 text-red-500 mx-auto mb-1" />
                    <p className="font-medium text-red-700 dark:text-red-300">PERDIDO</p>
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        )}
      </div>
    </DragDropContext>
  );
};
