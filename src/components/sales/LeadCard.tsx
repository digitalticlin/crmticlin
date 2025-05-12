
import { KanbanLead, FIXED_COLUMN_IDS } from "@/types/kanban";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DraggableProvided } from "react-beautiful-dnd";
import { MessageSquare, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

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
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{lead.name}</h4>
          {isWonLostView && (
            <Badge className={isWon ? "bg-green-500" : "bg-red-500"}>
              {isWon ? "Ganho" : "Perdido"}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{lead.lastMessageTime}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{lead.lastMessage}</p>
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-1">
          {lead.tags.map((tag) => (
            <Badge key={tag.id} className={cn("text-black", tag.color)}>
              {tag.name}
            </Badge>
          ))}
        </div>
        <div className="flex items-center space-x-1">
          {onReturnToFunnel && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onReturnToFunnel();
              }}
              title="Retornar ao funil"
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 text-blue-500" />
            </button>
          )}
          {onMoveToWon && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onMoveToWon();
              }}
              title="Marcar como ganho"
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <CheckCircle className="h-4 w-4 text-green-500" />
            </button>
          )}
          {onMoveToLost && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onMoveToLost();
              }}
              title="Marcar como perdido"
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XCircle className="h-4 w-4 text-red-500" />
            </button>
          )}
          {onOpenChat && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onOpenChat();
              }}
              title="Abrir chat"
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <MessageSquare className="h-4 w-4 text-ticlin" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
