
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
        "bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass-lg mb-4 rounded-xl p-4 cursor-pointer group relative",
        "w-[98.5%] max-w-[380px] mx-auto",
        // CRUCIAL: No transforms during drag - let react-beautiful-dnd handle positioning
        !isDragging && !isClone && "transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:border-white/50",
        isDragging && "opacity-90 rotate-2 shadow-2xl border-2 border-blue-400/60 bg-white/60",
        isWon && "border-l-[4px] border-l-green-500 bg-green-50/20",
        isLost && "border-l-[4px] border-l-red-500 bg-red-50/20"
      )}
      style={{
        // CRITICAL: Only use provided.draggableProps.style - no custom overrides
        ...provided.draggableProps.style,
        // Ensure proper z-index for dragging
        ...(isDragging && {
          zIndex: 9999,
          pointerEvents: 'none'
        })
      }}
      onClick={!isDragging ? handleCardClick : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Drag glow effect */}
      {isDragging && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 via-white/30 to-blue-400/20 animate-pulse pointer-events-none" />
      )}
      
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl pointer-events-none" />
      
      <LeadCardContent lead={lead} isWonLostView={isWonLostView} lostStageId={lostStageId} />
      
      {/* Tags and Actions Footer */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/30 relative z-10">
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
