
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Contact } from "@/types/chat";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";

interface ContactItemProps {
  contact: Contact;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu: () => void;
}

export const ContactItem: React.FC<ContactItemProps> = ({
  contact,
  isSelected,
  onClick,
  onContextMenu
}) => {
  const hasUnreadMessages = contact.unreadCount && contact.unreadCount > 0;
  const displayName = contact.name || formatPhoneDisplay(contact.phone);

  return (
    <div
      className={cn(
        "p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors",
        isSelected && "bg-gray-100 dark:bg-gray-800"
      )}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu();
      }}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 relative">
          <AvatarFallback>
            {displayName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
          <AvatarImage src={contact.avatar} alt={displayName} />
          {contact.isOnline && (
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
          )}
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h3 className="font-medium truncate">{displayName}</h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {contact.lastMessageTime}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {contact.lastMessage}
          </p>
        </div>
        
        {hasUnreadMessages && (
          <div className="bg-ticlin text-black rounded-full h-5 min-w-[20px] flex items-center justify-center text-xs font-medium">
            {contact.unreadCount}
          </div>
        )}
      </div>
    </div>
  );
};
