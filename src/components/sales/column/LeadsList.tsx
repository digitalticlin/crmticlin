
import { Droppable, Draggable } from "react-beautiful-dnd";
import { KanbanLead } from "@/types/kanban";
import { LeadCard } from "@/components/sales/LeadCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
  // Ensure the droppableId is valid and consistent by sanitizing it
  // This is crucial as react-beautiful-dnd is very strict about ID consistency
  const droppableId = columnId;
  
  return (
    <Droppable droppableId={droppableId} key={droppableId}>
      {(provided, snapshot) => (
        <ScrollArea className="flex-1 p-3">
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-h-full transition-all duration-300",
              "rounded-lg",
              snapshot.isDraggingOver && "bg-slate-100/80 dark:bg-slate-800/50",
              snapshot.isDraggingOver && "scale-[1.01] border border-primary/30",
              snapshot.isDraggingOver && "ring-2 ring-primary/10"
            )}
            style={{
              transition: 'all 0.3s ease-out',
              minHeight: '100px' // Ensure min height for empty columns
            }}
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
