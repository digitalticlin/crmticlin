
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
    if (onOpenChat) {
      onOpenChat();
    } else {
      onClick();
    }
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={cn(
        "glass dark:glass-dark card-glass-hover rounded-xl border border-white/20 shadow-md transition-soft cursor-pointer mb-4",
        isDragging && "card-glass-active z-50 opacity-95 ticlin-border",
        !isDragging && "hover:ticlin-border hover:scale-[1.04] hover:shadow-xl",
        isWon && "border-l-4 border-l-green-500",
        isLost && "border-l-4 border-l-red-500"
      )}
      onClick={handleCardClick}
      style={{
        ...provided.draggableProps.style,
        ...(isDragging ? {
          transformOrigin: 'center',
          transition: 'transform 0.14s, opacity 0.12s, box-shadow 0.16s',
          boxShadow: '0 10px 32px 0 #d3d80066, 0 2px 4px 0 rgba(50,50,0,0.12)',
          borderColor: '#d3d800'
        } : {})
      }}
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
