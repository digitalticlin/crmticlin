
import React from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { ColumnHeader } from "./ColumnHeader";
import { LeadCard } from "../lead/LeadCard";

interface BoardContentOptimizedProps {
  columns: KanbanColumn[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate: (updatedColumn: KanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  wonStageId: string;
  lostStageId: string;
}

export const BoardContentOptimized = ({
  columns,
  onOpenLeadDetail,
  onColumnUpdate,
  onColumnDelete,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false,
  wonStageId,
  lostStageId
}: BoardContentOptimizedProps) => {
  // Transform columns to match expected format
  const transformedColumns = columns.map((column, index) => ({
    ...column,
    position: index
  }));

  const transformedWonColumn = {
    id: wonStageId,
    title: "Ganhos",
    color: "#10b981",
    position: 0
  };

  const transformedLostColumn = {
    id: lostStageId,
    title: "Perdidos", 
    color: "#ef4444",
    position: 1
  };

  const columnsToRender = isWonLostView 
    ? [transformedWonColumn, transformedLostColumn]
    : transformedColumns;

  return (
    <div className="flex gap-6 h-full overflow-x-auto pb-6">
      {columnsToRender.map((column) => (
        <div key={column.id} className="flex-shrink-0 w-80">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-glass-lg h-full flex flex-col">
            <ColumnHeader
              column={column}
              isHovered={false}
              canEdit={!isWonLostView}
              onUpdate={onColumnUpdate}
              onDelete={onColumnDelete}
            />

            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 p-4 space-y-3 overflow-y-auto glass-scrollbar transition-colors duration-200 ${
                    snapshot.isDraggingOver
                      ? "bg-blue-500/10 border-blue-400/30"
                      : ""
                  }`}
                  style={{ minHeight: "200px" }}
                >
                  {column.leads?.map((lead, index) => (
                    <Draggable
                      key={lead.id}
                      draggableId={lead.id}
                      index={index}
                      isDragDisabled={isWonLostView}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                          }}
                        >
                          <LeadCard
                            lead={lead}
                            onOpenDetail={onOpenLeadDetail}
                            onOpenChat={onOpenChat}
                            onMoveToWonLost={onMoveToWonLost}
                            onReturnToFunnel={onReturnToFunnel}
                            isWonLostView={isWonLostView}
                            isDragging={snapshot.isDragging}
                            wonStageId={wonStageId}
                            lostStageId={lostStageId}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  
                  {column.leads?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">Nenhum lead nesta coluna</p>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      ))}
    </div>
  );
};
