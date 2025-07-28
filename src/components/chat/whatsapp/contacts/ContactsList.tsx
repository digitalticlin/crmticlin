import React from 'react';
import { Contact } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ContactsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onContactSelect: (contact: Contact) => void;
  searchQuery: string;
  isLoading: boolean;
}

export const ContactsList = ({ 
  contacts, 
  selectedContact, 
  onContactSelect, 
  searchQuery,
  isLoading 
}: ContactsListProps) => {

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Carregando contatos...
      </div>
    );
  }

  if (contacts.length === 0 && !searchQuery) {
    return (
      <div className="p-4 text-center text-gray-500">
        Nenhum contato encontrado.
      </div>
    );
  }

  if (contacts.length === 0 && searchQuery) {
    return (
      <div className="p-4 text-center text-gray-500">
        Nenhum contato encontrado para "{searchQuery}".
      </div>
    );
  }

  const handleContactSelect = (contact: Contact) => {
    onContactSelect(contact); // Fix: Call with only one argument
  };

  return (
    <div className="flex flex-col">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className={cn(
            "flex items-center space-x-3 py-2 px-3 rounded-md hover:bg-secondary cursor-pointer transition-colors",
            selectedContact?.id === contact.id ? "bg-secondary" : "bg-transparent"
          )}
          onClick={() => handleContactSelect(contact)}
        >
          <Avatar>
            <AvatarImage src={`https://avatar.vercel.sh/${contact.name}.png`} />
            <AvatarFallback>{contact.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium leading-none">{contact.name}</p>
            <p className="text-sm text-muted-foreground">{contact.lastMessage}</p>
          </div>
          {contact.unreadCount && contact.unreadCount > 0 && (
            <Badge variant="secondary">{contact.unreadCount}</Badge>
          )}
        </div>
      ))}
    </div>
  );
};
