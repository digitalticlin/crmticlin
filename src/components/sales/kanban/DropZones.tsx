
import { Droppable } from "react-beautiful-dnd";
import { CheckCircle, XCircle } from "lucide-react";

interface DropZonesProps {
  showDropZones: boolean;
}

export const DropZones = ({ showDropZones }: DropZonesProps) => {
  return (
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
  );
};
