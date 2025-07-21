
import React from 'react';
import { ContactsList } from "../ContactsList";
import { Contact } from "@/types/chat";

interface WhatsAppContactsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  isLoading: boolean;
}

export const WhatsAppContactsList = React.memo(({
  contacts,
  selectedContact,
  onSelectContact,
  isLoading
}: WhatsAppContactsListProps) => {
  if (isLoading && contacts.length === 0) {
    return (
      <div className="h-full w-full max-w-sm border-r border-gray-200 dark:border-gray-700 flex items-center justify-center bg-white/10 dark:bg-black/10 backdrop-blur-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <ContactsList
      contacts={contacts}
      selectedContact={selectedContact}
      onSelectContact={onSelectContact}
    />
  );
});
