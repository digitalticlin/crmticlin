
import React from 'react';
import { Contact } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export interface WhatsAppContactsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  isLoading?: boolean;
}

export const WhatsAppContactsList = ({
  contacts,
  selectedContact,
  onSelectContact,
  isLoading = false
}: WhatsAppContactsListProps) => {
  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3 p-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 border-b transition-colors ${
            selectedContact?.id === contact.id ? 'bg-blue-50 border-blue-200' : ''
          }`}
          onClick={() => onSelectContact(contact)}
        >
          <Avatar className="w-10 h-10 mr-3">
            <AvatarImage src={contact.avatar || contact.profilePicUrl} />
            <AvatarFallback>
              {contact.name ? contact.name.charAt(0).toUpperCase() : contact.phone.slice(-2)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {contact.name || contact.phone}
              </h3>
              {contact.unreadCount && contact.unreadCount > 0 && (
                <Badge variant="default" className="ml-2 text-xs">
                  {contact.unreadCount}
                </Badge>
              )}
            </div>
            
            {contact.lastMessage && (
              <p className="text-xs text-gray-500 truncate mt-1">
                {contact.lastMessage}
              </p>
            )}
            
            {contact.lastMessageTime && (
              <p className="text-xs text-gray-400 mt-1">
                {new Date(contact.lastMessageTime).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      ))}
      
      {contacts.length === 0 && !isLoading && (
        <div className="p-4 text-center text-gray-500">
          Nenhum contato encontrado
        </div>
      )}
    </div>
  );
};
