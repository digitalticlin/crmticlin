
import { Badge } from "@/components/ui/badge";
import { KanbanLead, FIXED_COLUMN_IDS } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { User } from "lucide-react";
import { LeadCardHeader } from "./LeadCardHeader";

interface LeadCardContentProps {
  lead: KanbanLead;
  isWonLostView?: boolean;
}

export const LeadCardContent = ({ lead, isWonLostView = false }: LeadCardContentProps) => {
  return (
    <>
      {/* Header with Avatar, Name, Unread Count, and Time */}
      <LeadCardHeader lead={lead} isWonLostView={isWonLostView} />

      {/* Message and Value Row */}
      <div className="flex justify-between items-start mb-3 gap-2">
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1 min-w-0">
          {lead.lastMessage}
        </p>
        
        {lead.purchaseValue !== undefined && (
          <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex-shrink-0 ml-2">
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
