
import { Badge } from "@/components/ui/badge";
import { KanbanLead, FIXED_COLUMN_IDS } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { User, Phone } from "lucide-react";
import { LeadCardHeader } from "./LeadCardHeader";

interface LeadCardContentProps {
  lead: KanbanLead;
  isWonLostView?: boolean;
  lostStageId?: string;
}

export const LeadCardContent = ({ lead, isWonLostView = false, lostStageId }: LeadCardContentProps) => {
  const isLost = lead.columnId === lostStageId;

  return (
    <>
      {/* Header with Avatar, Name, Unread Count, and Time */}
      <LeadCardHeader lead={lead} isWonLostView={isWonLostView} />

      {/* Phone Number Row */}
      {lead.phone && (
        <div className="flex items-center gap-2 mb-2">
          <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground font-medium">
            {lead.phone}
          </span>
        </div>
      )}

      {/* Message and Value Row */}
      <div className="flex justify-between items-start mb-3 gap-2">
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1 min-w-0">
          {lead.lastMessage}
        </p>
        
        {lead.purchaseValue !== undefined && (
          <span className={cn(
            "text-xs font-semibold flex-shrink-0 ml-2",
            isLost ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
          )}>
            {formatCurrency(lead.purchaseValue)}
          </span>
        )}
      </div>

      {/* Assigned User Row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {lead.assignedUser && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{lead.assignedUser}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
