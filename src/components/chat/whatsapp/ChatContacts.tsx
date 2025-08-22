
import React from 'react';
import { Contact } from '@/types/chat';
import { WhatsAppContactsList } from './WhatsAppContactsList';

interface ChatContactsProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  searchTerm: string;
  onSearch: (term: string) => void;
  contactsLoading: boolean;
  totalContactsAvailable: number;
}

export const ChatContacts = ({
  contacts,
  selectedContact,
  onSelectContact,
  searchTerm,
  onSearch,
  contactsLoading,
  totalContactsAvailable
}: ChatContactsProps) => {
  return (
    <WhatsAppContactsList
      contacts={contacts}
      selectedContact={selectedContact}
      onSelectContact={onSelectContact}
      isLoading={contactsLoading}
    />
  );
};
