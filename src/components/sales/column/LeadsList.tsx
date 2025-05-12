
import { Droppable, Draggable } from "react-beautiful-dnd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KanbanLead } from "@/types/kanban";
import { LeadCard } from "../LeadCard";

interface LeadsListProps {
  columnId: string;
  leads: KanbanLead[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
}

export const LeadsList = ({ 
  columnId, 
  leads, 
  onOpenLeadDetail, 
  onOpenChat, 
  onMoveToWonLost 
}: LeadsListProps) => {
  return (
    <Droppable droppableId={columnId}>
      {(provided) => (
        <ScrollArea
          className="flex-1 overflow-y-auto max-h-[calc(100vh-220px)] kanban-scroll"
        >
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="p-2 min-h-[100px]"
          >
            {leads.map((lead, index) => (
              <Draggable
                key={lead.id}
                draggableId={lead.id}
                index={index}
              >
                {(provided) => (
                  <LeadCard 
                    lead={lead} 
                    provided={provided} 
                    onClick={() => onOpenLeadDetail(lead)} 
                    onOpenChat={onOpenChat ? () => onOpenChat(lead) : undefined}
                    onMoveToWon={onMoveToWonLost ? () => onMoveToWonLost(lead, "won") : undefined}
                    onMoveToLost={onMoveToWonLost ? () => onMoveToWonLost(lead, "lost") : undefined}
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
