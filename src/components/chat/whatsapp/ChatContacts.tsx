
import React from 'react';
import { Contact } from '@/types/chat';
import { WhatsAppContactsList } from './WhatsAppContactsList';

interface ChatContactsProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  isLoading?: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export const ChatContacts = ({
  contacts,
  selectedContact,
  onSelectContact,
  isLoading = false,
  searchTerm = '',
  onSearchChange
}: ChatContactsProps) => {
  return (
    <WhatsAppContactsList
      contacts={contacts}
      selectedContact={selectedContact}
      onSelectContact={onSelectContact}
      isLoading={isLoading}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
    />
  );
};
