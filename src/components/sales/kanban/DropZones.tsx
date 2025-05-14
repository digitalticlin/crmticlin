
import { Droppable } from "react-beautiful-dnd";

interface DropZonesProps {
  showDropZones: boolean;
}

export const DropZones = ({ showDropZones }: DropZonesProps) => {
  if (!showDropZones) {
    return (
      <div style={{ display: "none" }}>
        <Droppable droppableId="drop-zone-won">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        <Droppable droppableId="drop-zone-lost">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  }
  return (
    <div className="fixed bottom-10 left-0 right-0 flex justify-center gap-10 z-50 pointer-events-none">
      {/* Dropzone GANHO */}
      <Droppable droppableId="drop-zone-won">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="pointer-events-auto flex flex-col items-center justify-end"
            style={{
              width: "180px",
              height: "100px",
              borderRadius: "32px",
              background: "linear-gradient(135deg, #fffbe0cc 30%, #e7e8be90 100%)",
              filter: "blur(2px)",
              boxShadow: "0 2px 24px #d3d80033",
              border: "2px solid #d3d80066",
              opacity: 0.95,
              transition: "all 0.16s"
            }}
          >
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      {/* Dropzone PERDIDO */}
      <Droppable droppableId="drop-zone-lost">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="pointer-events-auto flex flex-col items-center justify-end"
            style={{
              width: "180px",
              height: "100px",
              borderRadius: "32px",
              background: "linear-gradient(135deg, #fffbe0cc 30%, #e7e8be90 100%)",
              filter: "blur(2px)",
              boxShadow: "0 2px 24px #d3d80033",
              border: "2px solid #d3d80066",
              opacity: 0.95,
              transition: "all 0.16s"
            }}
          >
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
