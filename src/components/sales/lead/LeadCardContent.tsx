
import { Badge } from "@/components/ui/badge";
import { KanbanLead, FIXED_COLUMN_IDS } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { User, Phone } from "lucide-react";

interface LeadCardContentProps {
  lead: KanbanLead;
  isWonLostView?: boolean;
}

export const LeadCardContent = ({ lead, isWonLostView = false }: LeadCardContentProps) => {
  const isWon = isWonLostView && lead.columnId === FIXED_COLUMN_IDS.WON;
  const isLost = isWonLostView && lead.columnId === FIXED_COLUMN_IDS.LOST;
  const isNewLead = lead.columnId === FIXED_COLUMN_IDS.NEW_LEAD;
  const nameIsId = isNewLead && lead.name.startsWith("ID:");

  return (
    <>
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              "font-inter font-bold text-base leading-tight",
              nameIsId && "text-amber-600 dark:text-amber-500 font-bold"
            )}>
              {lead.name}
              {nameIsId && <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-300">Editar nome</Badge>}
            </h4>
            {isWonLostView && (
              <Badge
                className={isWon ? "bg-green-500 text-white" : "bg-red-500 text-white"}
              >
                {isWon ? "Ganho" : "Perdido"}
              </Badge>
            )}
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground font-medium">
            {lead.assignedUser && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {lead.assignedUser}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {lead.phone}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-neutral-400 dark:text-neutral-300">{lead.lastMessageTime}</span>
          {lead.purchaseValue !== undefined && (
            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(lead.purchaseValue)}
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{lead.lastMessage}</p>
    </>
  );
};
