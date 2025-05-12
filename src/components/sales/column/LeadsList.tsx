
import { Droppable, Draggable } from "react-beautiful-dnd";
import { KanbanLead } from "@/types/kanban";
import { LeadCard } from "@/components/sales/LeadCard";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LeadsListProps {
  columnId: string;
  leads: KanbanLead[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
}

export const LeadsList = ({ 
  columnId, 
  leads, 
  onOpenLeadDetail, 
  onOpenChat, 
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false
}: LeadsListProps) => {
  // Ensure the droppable ID is valid and consistent
  const droppableId = columnId;
  
  return (
    <Droppable droppableId={droppableId} key={droppableId}>
      {(provided, snapshot) => (
        <ScrollArea className="flex-1 p-3">
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-full transition-colors duration-300 ${snapshot.isDraggingOver ? 'bg-slate-100/50 dark:bg-slate-800/50 rounded-lg' : ''}`}
          >
            {leads.map((lead, index) => (
              <Draggable
                key={lead.id}
                draggableId={lead.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <LeadCard 
                    lead={lead} 
                    provided={provided} 
                    onClick={() => onOpenLeadDetail(lead)} 
                    onOpenChat={onOpenChat ? () => onOpenChat(lead) : undefined}
                    onMoveToWon={onMoveToWonLost ? () => onMoveToWonLost(lead, "won") : undefined}
                    onMoveToLost={onMoveToWonLost ? () => onMoveToWonLost(lead, "lost") : undefined}
                    onReturnToFunnel={onReturnToFunnel ? () => onReturnToFunnel(lead) : undefined}
                    isWonLostView={isWonLostView}
                    isDragging={snapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        </ScrollArea>
      )}
    </Droppable>
  );
};
