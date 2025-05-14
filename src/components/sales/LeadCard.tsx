import { KanbanLead, FIXED_COLUMN_IDS } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { DraggableProvided } from "react-beautiful-dnd";
import { LeadCardContent } from "./lead/LeadCardContent";
import { LeadCardTags } from "./lead/LeadCardTags";
import { LeadCardActions } from "./lead/LeadCardActions";

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
  isDragging = false
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
        "glass bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl mb-3 rounded-2xl border-2 border-transparent shadow-glass-lg transition-all duration-200 p-3 cursor-pointer font-inter",
        isDragging && "shadow-glass scale-105 opacity-90 border-[#d3d800] z-50",
        !isDragging && "hover:shadow-glass-lg hover:scale-[1.02] hover:border-[#d3d800]",
        isWon && "border-l-4 border-l-green-500",
        isLost && "border-l-4 border-l-red-500"
      )}
      style={{
        ...provided.draggableProps.style,
        ...(isDragging ? {
          transformOrigin: 'center',
          transition: 'transform 0.16s cubic-bezier(.25,.8,.25,1), opacity 0.1s, box-shadow 0.16s',
        } : {})
      }}
      onClick={handleCardClick}
    >
      <LeadCardContent lead={lead} isWonLostView={isWonLostView} />
      <div className="flex justify-between items-center">
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
