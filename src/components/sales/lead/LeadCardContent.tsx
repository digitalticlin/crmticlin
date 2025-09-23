
import { Badge } from "@/components/ui/badge";
import { KanbanLead, FIXED_COLUMN_IDS } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { User, Phone, MessageCircle } from "lucide-react";
import { LeadCardHeader } from "./LeadCardHeader";

interface LeadCardContentProps {
  lead: KanbanLead;
  isWonLostView?: boolean;
  lostStageId?: string;
}

export const LeadCardContent = ({ lead, isWonLostView = false, lostStageId }: LeadCardContentProps) => {
  const isLost = lead.columnId === lostStageId;

  // Logs removidos - evitar loops no render

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

  // Determinar usuário responsável - priorizando o nome quando disponível
  const responsibleUser = lead.ownerName || lead.assignedUser;
  
  // Logs removidos - evitar loops no render

  return (
    <>
      {/* Header with Avatar, Name, Unread Count, and Time */}
      <LeadCardHeader lead={lead} isWonLostView={isWonLostView} />

      {/* Phone Number Row - espaçamento reduzido */}
      {lead.phone && (
        <div className="flex items-center gap-2 mb-1.5">
          <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground font-medium">
            {lead.phone}
          </span>
        </div>
      )}

      {/* Message and Value Row - reduzido para 1 linha com ícone de chat */}
      <div className="flex justify-between items-center mb-2 gap-2">
        <p className="text-sm text-muted-foreground line-clamp-1 flex-1 min-w-0">
          {lead.lastMessage || lead.last_message || "Sem mensagem"}
        </p>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasNegotiationValue && (
            <span className={cn(
              "text-xs font-semibold",
              isLost ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
            )}>
              {formatCurrency(negotiationValue)}
            </span>
          )}
          
          {/* Ícone de Chat - área clicável separada do DnD */}
          <div
            className="p-1 hover:bg-blue-100 rounded-full cursor-pointer transition-colors duration-200 chat-icon-area"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              // NÃO usar stopPropagation aqui - deixar o evento subir para LeadCard detectar
              console.log('[LeadCardContent] 💬 Chat icon clicked - evento será propagado para LeadCard');
            }}
          >
            <MessageCircle className="h-4 w-4 text-blue-600" />
          </div>
        </div>
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
