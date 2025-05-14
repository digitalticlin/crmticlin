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
  const droppableId = columnId;
  
  return (
    <Droppable droppableId={droppableId} key={droppableId}>
      {(provided, snapshot) => (
        <ScrollArea className="flex-1 p-3">
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-h-full transition-soft duration-200 rounded-2xl",
              snapshot.isDraggingOver && "highlight-drop bg-white/60 dark:bg-[#d3d8001a]"
            )}
            style={{
              minHeight: '100px'
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
