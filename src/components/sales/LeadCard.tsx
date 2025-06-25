
import { KanbanLead, FIXED_COLUMN_IDS } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { DraggableProvided } from "react-beautiful-dnd";
import { LeadCardContent } from "./lead/LeadCardContent";
import { LeadCardTags } from "./lead/LeadCardTags";
import { LeadCardActions } from "./lead/LeadCardActions";
import React from "react";

interface LeadCardProps {
  lead: KanbanLead;
  provided: DraggableProvided;
  onClick: () => void;
  onOpenChat?: () => void;
  onMoveToWon?: () => void;
  onMoveToLost?: () => void;
  onReturnToFunnel?: () => void;
  isWonLostView?: boolean;
  isDragging?: boolean;
  isClone?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  wonStageId?: string;
  lostStageId?: string;
}

export const LeadCard = ({
  lead,
  provided,
  onClick,
  onOpenChat,
  onMoveToWon,
  onMoveToLost,
  onReturnToFunnel,
  isWonLostView = false,
  isDragging = false,
  isClone = false,
  onMouseEnter,
  onMouseLeave,
  wonStageId,
  lostStageId
}: LeadCardProps) => {
  const isWon = isWonLostView && lead.columnId === wonStageId;
  const isLost = isWonLostView && lead.columnId === lostStageId;
  
  const handleCardClick = () => {
    if (onOpenChat) onOpenChat();
    else onClick();
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={cn(
        "bg-white/25 backdrop-blur-lg border border-white/30 mb-4 rounded-2xl transition-all duration-300 p-4 cursor-pointer group relative",
        "w-[96%] max-w-[380px] mx-auto hover:shadow-xl",
        isDragging || isClone
          ? "scale-105 z-[99999] opacity-90 shadow-2xl border-ticlin/50 border-2 pointer-events-none bg-white/40 transform rotate-2"
          : "hover:scale-[1.02] hover:z-30 hover:relative hover:bg-white/35",
        isWon && "border-l-[4px] border-l-green-500",
        isLost && "border-l-[4px] border-l-red-500"
      )}
      style={{
        ...provided.draggableProps.style,
        ...(isDragging || isClone
          ? {
              transformOrigin: "center",
              boxShadow: "0 25px 50px 0 rgba(0,0,0,0.25), 0 0 0 1px rgba(211,216,0,0.7), 0 0 20px rgba(211,216,0,0.3)",
              transition: "transform 0.18s cubic-bezier(.16,.83,.81,1), opacity 0.13s, box-shadow 0.18s",
              zIndex: 99999,
              pointerEvents: "none",
              background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }
          : {})
      }}
      onClick={handleCardClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Efeito de brilho durante drag */}
      {(isDragging || isClone) && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
      )}
      
      <LeadCardContent lead={lead} isWonLostView={isWonLostView} lostStageId={lostStageId} />
      
      {/* Tags and Actions Footer */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/20">
        <div className="flex-1 min-w-0 mr-2">
          <LeadCardTags tags={lead.tags} />
        </div>
        <LeadCardActions
          leadId={lead.id}
          leadColumnId={lead.columnId}
          onMoveToWon={onMoveToWon}
          onMoveToLost={onMoveToLost}
          onReturnToFunnel={onReturnToFunnel}
          wonStageId={wonStageId}
          lostStageId={lostStageId}
          isWonLostView={isWonLostView}
        />
      </div>
    </div>
  );
};
