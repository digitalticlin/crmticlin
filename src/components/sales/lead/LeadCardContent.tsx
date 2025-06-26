
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

  // Debug logs para verificar valores
  console.log('[LeadCardContent] Debug lead data:', {
    name: lead.name,
    purchaseValue: lead.purchaseValue,
    purchase_value: lead.purchase_value,
    unreadCount: lead.unreadCount,
    unread_count: lead.unread_count,
    assignedUser: lead.assignedUser,
    owner_id: lead.owner_id
  });

  // Determinar valor da negociação (verificar ambos os campos)
  const negotiationValue = lead.purchaseValue !== undefined && lead.purchaseValue !== null 
    ? lead.purchaseValue 
    : lead.purchase_value;
  
  const hasNegotiationValue = negotiationValue !== undefined && negotiationValue !== null && negotiationValue > 0;

  // Determinar contagem de mensagens não lidas (verificar ambos os campos)
  const unreadMessages = lead.unreadCount !== undefined && lead.unreadCount !== null 
    ? lead.unreadCount 
    : lead.unread_count;
  
  const hasUnreadMessages = unreadMessages !== undefined && unreadMessages !== null && unreadMessages > 0;

  // Determinar usuário responsável
  const responsibleUser = lead.assignedUser || lead.owner_id;

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
          {lead.lastMessage || lead.last_message || "Sem mensagem"}
        </p>
        
        {hasNegotiationValue && (
          <span className={cn(
            "text-xs font-semibold flex-shrink-0 ml-2",
            isLost ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
          )}>
            {formatCurrency(negotiationValue)}
          </span>
        )}
      </div>

      {/* Assigned User Row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {responsibleUser ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{responsibleUser}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-gray-400 truncate">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Não atribuído</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
