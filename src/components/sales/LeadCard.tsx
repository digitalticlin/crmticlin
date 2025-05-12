
import { KanbanLead } from "@/types/kanban";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DraggableProvided } from "react-beautiful-dnd";
import { MessageSquare, CheckCircle, XCircle, Phone } from "lucide-react";

interface LeadCardProps {
  lead: KanbanLead;
  provided: DraggableProvided;
  onClick: () => void;
  onOpenChat?: () => void;
  onMoveToWon?: () => void;
  onMoveToLost?: () => void;
}

export const LeadCard = ({ 
  lead, 
  provided, 
  onClick, 
  onOpenChat, 
  onMoveToWon, 
  onMoveToLost 
}: LeadCardProps) => {
  // Mock values for demonstration as per reference image
  const opportunityValue = `R$ ${(Math.random() * 50000).toFixed(2)}`;
  const shortCode = lead.name.split(' ').map(n => n[0]).slice(0, 2).join('');
  
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className="bg-black/40 dark:bg-gray-800/70 mb-3 rounded-lg border border-gray-600/30 
                backdrop-blur-lg shadow-md hover:shadow-lg transition-shadow p-3 cursor-pointer animate-fade-in"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-white">{lead.name}</h4>
        <span className="text-sm font-semibold text-green-400">{opportunityValue}</span>
      </div>
      
      <div className="flex items-center text-gray-300 mb-3">
        <Phone className="h-3 w-3 mr-1" />
        <span className="text-xs">{lead.phone || "(11) 98765-4321"}</span>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-3">
        {lead.tags.map((tag) => (
          <Badge key={tag.id} className={cn("text-black font-medium text-xs", tag.color)}>
            {tag.name}
          </Badge>
        ))}
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-gray-700 text-xs text-white mr-1">
            {shortCode}
          </span>
          <span className="text-xs text-gray-400">R$ {Math.floor(Math.random() * 50000)}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          {onMoveToWon && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onMoveToWon();
              }}
              title="Marcar como ganho"
              className="p-1 rounded-full hover:bg-gray-700"
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
              className="p-1 rounded-full hover:bg-gray-700"
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
              className="p-1 rounded-full hover:bg-gray-700"
            >
              <MessageSquare className="h-4 w-4 text-ticlin" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
