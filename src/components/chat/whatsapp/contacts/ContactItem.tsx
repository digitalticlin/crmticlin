
import React, { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Contact } from '@/types/chat';
import { cn } from '@/lib/utils';
import { formatPhoneDisplay } from '@/utils/phoneFormatter';

interface ContactItemProps {
  contact: Contact;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export const ContactItem: React.FC<ContactItemProps> = memo(({
  contact,
  isSelected,
  onClick,
  className
}) => {
  const displayName = contact.name || formatPhoneDisplay(contact.phone);
  const hasUnreadMessages = contact.unreadCount && contact.unreadCount > 0;

  return (
    <div
      className={cn(
        "p-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
        isSelected && "bg-gray-100 dark:bg-gray-800",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
              {displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
            <AvatarImage src={contact.avatar} alt={displayName} />
          </Avatar>
          {contact.isOnline && (
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className={cn(
              "font-medium truncate text-sm",
              hasUnreadMessages ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
            )}>
              {displayName}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
              {contact.lastMessageTime}
            </span>
          </div>
          
          <div className="flex justify-between items-center mt-1">
            <p className={cn(
              "text-xs truncate",
              hasUnreadMessages ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-500 dark:text-gray-400"
            )}>
              {contact.lastMessage || 'Nenhuma mensagem'}
            </p>
            
            {hasUnreadMessages && (
              <div className="bg-ticlin text-black rounded-full h-5 min-w-[20px] flex items-center justify-center text-xs font-medium ml-2">
                {contact.unreadCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ContactItem.displayName = 'ContactItem';
