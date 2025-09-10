
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { KanbanLead, FIXED_COLUMN_IDS } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { MessageCircle, User } from "lucide-react";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";

interface LeadCardHeaderProps {
  lead: KanbanLead;
  isWonLostView?: boolean;
}

export const LeadCardHeader = ({ lead, isWonLostView = false }: LeadCardHeaderProps) => {
  const isNewLead = lead.columnId === FIXED_COLUMN_IDS.NEW_LEAD;
  const nameIsId = isNewLead && lead.name.startsWith("ID:");
  
  // ATUALIZADO: Usar telefone formatado quando nome não disponível ou é ID
  const displayName = nameIsId ? formatPhoneDisplay(lead.phone) : (lead.name || formatPhoneDisplay(lead.phone));
  
  // CORREÇÃO: Verificar mensagens não lidas de ambos os campos possíveis
  const unreadCount = lead.unreadCount !== undefined && lead.unreadCount !== null 
    ? lead.unreadCount 
    : lead.unread_count;
  
  const hasUnreadMessages = unreadCount !== undefined && unreadCount !== null && unreadCount > 0;

  // Aumentar limite do nome já que não temos mais o horário
  const truncatedName = displayName.length > 25 
    ? `${displayName.substring(0, 25)}...` 
    : displayName;

  console.log('[LeadCardHeader] Debug profile pic & unread messages:', {
    leadName: lead.name,
    profile_pic_url: lead.profile_pic_url,
    avatar: lead.avatar,
    finalAvatarSrc: lead.profile_pic_url || '/avatar-lead.png',
    unreadCount: lead.unreadCount,
    unread_count: lead.unread_count,
    finalUnreadCount: unreadCount,
    hasUnreadMessages
  });

  return (
    <div className="flex items-center gap-2 mb-2">
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <img 
          src={lead.profile_pic_url && lead.profile_pic_url.trim() !== '' ? lead.profile_pic_url : '/avatar-lead.png'} 
          alt={displayName}
          className="h-full w-full object-cover rounded-full"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            console.log('[LeadCardHeader] Avatar load error, switching to default:', target.src);
            if (!target.src.includes('avatar-lead.png')) {
              target.src = '/avatar-lead.png';
            }
          }}
        />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      {/* Name/Phone and Unread Indicator - Agora com mais espaço */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <h4 className={cn(
          "font-inter font-bold text-sm leading-tight truncate",
          nameIsId && "text-amber-600 dark:text-amber-500"
        )}>
          {truncatedName}
        </h4>
        
        {nameIsId && (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs px-1 py-0">
            Editar
          </Badge>
        )}
        
        {/* CORREÇÃO: Badge de mensagens não lidas com condição melhorada */}
        {hasUnreadMessages && (
          <div className="flex items-center gap-1 bg-red-500 text-white rounded-full px-2 py-1 text-xs flex-shrink-0">
            <MessageCircle className="h-3 w-3" />
            <span>{unreadCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};
