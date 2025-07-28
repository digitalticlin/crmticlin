
import React from 'react';
import { Contact } from '@/types/chat';
import { TiclinAvatar } from '@/components/ui/ticlin-avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactItemProps {
  contact: Contact;
  isSelected: boolean;
  onSelect: (contact: Contact) => void;
  isOnline?: boolean;
  unreadCount?: number;
  currentStageId?: string;
  onStageChange?: (newStage: any) => void;
}

export const ContactItem = ({
  contact,
  isSelected,
  onSelect,
  isOnline = false,
  unreadCount = 0,
  currentStageId,
  onStageChange
}: ContactItemProps) => {
  const handleClick = () => {
    onSelect(contact);
  };

  const lastMessageTime = contact.last_message_at 
    ? formatDistanceToNow(new Date(contact.last_message_at), { 
        addSuffix: true, 
        locale: ptBR 
      })
    : null;

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/10",
        isSelected && "bg-white/20 border border-white/30"
      )}
    >
      <div className="relative">
        <TiclinAvatar
          profilePicUrl={contact.profile_pic_url}
          name={contact.name}
          size="md"
        />
        {isOnline && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-white truncate">{contact.name}</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-white/70 truncate">
            {contact.last_message || 'Sem mensagens'}
          </p>
          {lastMessageTime && (
            <span className="text-xs text-white/50 ml-2">
              {lastMessageTime}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <MessageSquare className="h-3 w-3 text-white/50" />
          <span className="text-xs text-white/50">
            {contact.phone}
          </span>
        </div>
      </div>
    </div>
  );
};
