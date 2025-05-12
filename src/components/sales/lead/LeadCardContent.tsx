
import { Badge } from "@/components/ui/badge";
import { KanbanLead, FIXED_COLUMN_IDS } from "@/types/kanban";
import { cn } from "@/lib/utils";

interface LeadCardContentProps {
  lead: KanbanLead;
  isWonLostView?: boolean;
}

export const LeadCardContent = ({ lead, isWonLostView = false }: LeadCardContentProps) => {
  const isWon = isWonLostView && lead.columnId === FIXED_COLUMN_IDS.WON;
  const isLost = isWonLostView && lead.columnId === FIXED_COLUMN_IDS.LOST;

  return (
    <>
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
    </>
  );
};
