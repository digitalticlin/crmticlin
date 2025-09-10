
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Contact } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ContactSelectionItemProps {
  contact: Contact;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const ContactSelectionItem: React.FC<ContactSelectionItemProps> = ({
  contact,
  isSelected,
  onToggle,
  disabled = false
}) => {
  const displayName = contact.name || contact.phone;
  const initials = displayName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
        "hover:bg-white/10 border border-transparent",
        isSelected && "bg-blue-50/50 border-blue-200/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={!disabled ? onToggle : undefined}
    >
      <Checkbox
        checked={isSelected}
        onChange={onToggle}
        disabled={disabled}
        className="pointer-events-none"
      />
      
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarImage src={contact.avatar} alt={displayName} />
        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">
          {displayName}
        </div>
        <div className="text-sm text-gray-500 truncate">
          {contact.phone}
        </div>
      </div>
      
      {contact.unreadCount > 0 && (
        <div className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
          {contact.unreadCount}
        </div>
      )}
    </div>
  );
};
