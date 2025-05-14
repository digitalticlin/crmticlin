
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
  onMouseLeave
}: LeadCardProps) => {
  const isWon = isWonLostView && lead.columnId === FIXED_COLUMN_IDS.WON;
  const isLost = isWonLostView && lead.columnId === FIXED_COLUMN_IDS.LOST;
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
        // Largura limitada + centralizado na coluna (ajuste aqui)
        "glass bg-white/70 dark:bg-black/30 backdrop-blur-xl mb-5 rounded-3xl border-2 border-transparent shadow-glass-lg transition-all duration-300 p-4 cursor-pointer font-inter group",
        "w-[88%] max-w-[320px] mx-auto", // <-- centralizado e mais estreito
        isDragging || isClone
          ? "scale-105 z-[99999] opacity-90 shadow-glass-lg border-ticlin border-2 pointer-events-none"
          : "hover:scale-105 hover:z-30 hover:relative hover:shadow-2xl hover:border-ticlin hover:border-2",
        isWon && "border-l-[4px] border-l-green-500",
        isLost && "border-l-[4px] border-l-red-500"
      )}
      style={{
        ...provided.draggableProps.style,
        ...(isDragging || isClone
          ? {
              transformOrigin: "center",
              boxShadow: "0 12px 36px 0 rgba(211,216,0,.18)",
              transition:
                "transform 0.18s cubic-bezier(.16,.83,.81,1), opacity 0.13s, box-shadow 0.18s",
              zIndex: 99999,
              pointerEvents: "none",
            }
          : {})
      }}
      onClick={handleCardClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <LeadCardContent lead={lead} isWonLostView={isWonLostView} />
      <div className="flex justify-between items-center mt-2">
        <LeadCardTags tags={lead.tags} />
        <LeadCardActions
          onMoveToWon={onMoveToWon}
          onMoveToLost={onMoveToLost}
          onReturnToFunnel={onReturnToFunnel}
        />
      </div>
    </div>
  );
};
