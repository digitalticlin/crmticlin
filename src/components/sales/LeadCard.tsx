
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
}

export const LeadCard = ({ 
  lead, 
  provided, 
  onClick, 
  onOpenChat, 
  onMoveToWon, 
  onMoveToLost,
  onReturnToFunnel,
  isWonLostView = false
}: LeadCardProps) => {
  const isWon = isWonLostView && lead.columnId === FIXED_COLUMN_IDS.WON;
  const isLost = isWonLostView && lead.columnId === FIXED_COLUMN_IDS.LOST;

  // Now the entire card opens chat by default when clicked
  const handleCardClick = () => {
    if (onOpenChat) {
      onOpenChat();
    } else {
      onClick(); // Fallback to the default onClick behavior if onOpenChat isn't provided
    }
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={cn(
        "bg-white dark:bg-gray-800 mb-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow p-3 cursor-pointer animate-fade-in",
        isWon && "border-l-4 border-l-green-500",
        isLost && "border-l-4 border-l-red-500"
      )}
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
