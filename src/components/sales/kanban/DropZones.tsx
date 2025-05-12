
import { Droppable } from "react-beautiful-dnd";

interface DropZonesProps {
  showDropZones: boolean;
}

export const DropZones = ({ showDropZones }: DropZonesProps) => {
  // If not showing the drop zones, don't render anything
  if (!showDropZones) {
    return null;
  }
  
  // These droppable areas will be invisible but still functional
  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-6 z-50 px-6">
      {/* Won drop zone - invisible but functional */}
      <Droppable droppableId="drop-zone-won">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="invisible"
            style={{ width: '200px', height: '100px' }}
          >
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Lost drop zone - invisible but functional */}
      <Droppable droppableId="drop-zone-lost">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="invisible"
            style={{ width: '200px', height: '100px' }}
          >
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
