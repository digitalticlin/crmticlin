
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
  
  const handleCardClick = (e: React.MouseEvent) => {
    // CRITICAL: Don't handle clicks during drag state
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
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
        // OPTIMIZED: Clean drag states without conflicting transforms
        !isDragging && "transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:border-white/50",
        // CRITICAL: Simplified drag state - let react-beautiful-dnd handle positioning completely
        isDragging && "opacity-95 shadow-2xl border-2 border-blue-400/60 bg-white/70",
        isWon && "border-l-[4px] border-l-green-500 bg-green-50/20",
        isLost && "border-l-[4px] border-l-red-500 bg-red-50/20"
      )}
      style={{
        // CRITICAL: Only use provided styles - no custom overrides that conflict
        ...provided.draggableProps.style,
        // Ensure proper layering during drag
        ...(isDragging && {
          zIndex: 9999,
          // Remove pointer events during drag to prevent conflicts
          pointerEvents: 'none',
          // Ensure visibility
          opacity: 0.95
        })
      }}
      onClick={handleCardClick}
      onMouseEnter={!isDragging ? onMouseEnter : undefined}
      onMouseLeave={!isDragging ? onMouseLeave : undefined}
    >
      {/* Enhanced drag visual feedback */}
      {isDragging && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/30 via-white/40 to-blue-400/30 animate-pulse pointer-events-none z-10" />
      )}
      
      {/* Glassmorphism overlay - adjusted for drag state */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl pointer-events-none",
        isDragging && "from-white/10 to-white/5"
      )} />
      
      {/* Content with proper z-index */}
      <div className="relative z-20">
        <LeadCardContent lead={lead} isWonLostView={isWonLostView} lostStageId={lostStageId} />
        
        {/* Tags and Actions Footer */}
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/30">
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
    </div>
  );
};
