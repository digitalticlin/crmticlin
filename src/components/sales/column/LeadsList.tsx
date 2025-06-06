
import { Droppable, Draggable } from "react-beautiful-dnd";
import { KanbanLead } from "@/types/kanban";
import { LeadCard } from "@/components/sales/LeadCard";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

interface LeadsListProps {
  columnId: string;
  leads: KanbanLead[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  renderClone?: any;
  onAnyCardMouseEnter?: () => void;
  onAnyCardMouseLeave?: () => void;
  wonStageId?: string;
  lostStageId?: string;
}

export const LeadsList = ({
  columnId,
  leads,
  onOpenLeadDetail,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false,
  renderClone,
  onAnyCardMouseEnter,
  onAnyCardMouseLeave,
  wonStageId,
  lostStageId
}: LeadsListProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const droppableId = columnId;

  return (
    <Droppable droppableId={droppableId} key={droppableId} renderClone={renderClone}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            "flex-1 h-full overflow-y-auto kanban-column-scrollbar transition-all duration-200 rounded-3xl p-2",
            (typeof hoveredIndex === "number" || snapshot.isDraggingOver) && "overflow-visible",
            snapshot.isDraggingOver &&
              "ring-2 ring-ticlin/80 bg-white/10 shadow-lg scale-[1.02]"
          )}
          style={{
            transition: "background-color 0.3s, transform 0.25s, border 0.2s",
            minHeight: "200px",
            maxHeight: "calc(100vh - 280px)",
            position: "relative",
            zIndex: 2,
            overflow: (typeof hoveredIndex === "number" || snapshot.isDraggingOver) ? "visible" : "auto",
          }}
        >
          {leads.map((lead, index) => (
            <Draggable key={lead.id} draggableId={lead.id} index={index}>
              {(provided, snapshot) => (
                <LeadCard
                  lead={lead}
                  provided={provided}
                  onClick={() => onOpenLeadDetail(lead)}
                  onOpenChat={onOpenChat ? () => onOpenChat(lead) : undefined}
                  onMoveToWon={
                    onMoveToWonLost ? () => onMoveToWonLost(lead, "won") : undefined
                  }
                  onMoveToLost={
                    onMoveToWonLost ? () => onMoveToWonLost(lead, "lost") : undefined
                  }
                  onReturnToFunnel={onReturnToFunnel ? () => onReturnToFunnel(lead) : undefined}
                  isWonLostView={isWonLostView}
                  isDragging={snapshot.isDragging}
                  onMouseEnter={() => {
                    setHoveredIndex(index);
                    onAnyCardMouseEnter && onAnyCardMouseEnter();
                  }}
                  onMouseLeave={() => {
                    setHoveredIndex(null);
                    onAnyCardMouseLeave && onAnyCardMouseLeave();
                  }}
                  wonStageId={wonStageId}
                  lostStageId={lostStageId}
                />
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};
