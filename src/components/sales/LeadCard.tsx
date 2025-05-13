
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
        "bg-white dark:bg-gray-800 mb-3 rounded-lg border border-gray-200 dark:border-gray-700",
        "shadow-sm transition-all duration-200 p-3 cursor-pointer",
        "hover:border-primary/40 hover:shadow-md hover:scale-[1.01]",
        isDragging && "shadow-lg scale-[1.03] border-primary border-2 z-50 opacity-100",
        isDragging && "ring-4 ring-primary/20 ring-offset-1",
        !isDragging && "hover:shadow-md animate-fade-in",
        isWon && "border-l-4 border-l-green-500",
        isLost && "border-l-4 border-l-red-500"
      )}
      onClick={handleCardClick}
      style={{
        ...provided.draggableProps.style,
        // Fix DnD issues by ensuring proper positioning during drag
        ...(isDragging ? {
          transformOrigin: 'center',
          transition: 'all 0.15s ease-out',
          boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 9999
        } : {})
      }}
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
