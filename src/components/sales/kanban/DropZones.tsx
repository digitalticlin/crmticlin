
import { Droppable } from "react-beautiful-dnd";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface DropZonesProps {
  showDropZones: boolean;
}

export const DropZones = ({ showDropZones }: DropZonesProps) => {
  // If not showing the drop zones, render empty droppables to maintain registry
  if (!showDropZones) {
    return (
      <div style={{ display: 'none' }}>
        <Droppable droppableId="drop-zone-won">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        
        <Droppable droppableId="drop-zone-lost">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  }
  
  // Enhanced visible drop zones with animations
  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-6 z-50 px-6 animate-fade-in">
      {/* Won drop zone */}
      <Droppable droppableId="drop-zone-won">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex items-center justify-center w-64 h-16 rounded-lg",
              "border-2 border-green-500 bg-green-50/80 dark:bg-green-900/30",
              "backdrop-blur-sm shadow-lg transition-all duration-300",
              snapshot.isDraggingOver && "scale-105 border-green-400 bg-green-100/90 dark:bg-green-800/50",
              snapshot.isDraggingOver && "ring-4 ring-green-300/50"
            )}
          >
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
              <Check className="h-5 w-5" />
              <span>Mover para Ganhos</span>
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Lost drop zone */}
      <Droppable droppableId="drop-zone-lost">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex items-center justify-center w-64 h-16 rounded-lg",
              "border-2 border-red-500 bg-red-50/80 dark:bg-red-900/30", 
              "backdrop-blur-sm shadow-lg transition-all duration-300",
              snapshot.isDraggingOver && "scale-105 border-red-400 bg-red-100/90 dark:bg-red-800/50",
              snapshot.isDraggingOver && "ring-4 ring-red-300/50"
            )}
          >
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium">
              <X className="h-5 w-5" />
              <span>Mover para Perdidos</span>
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
