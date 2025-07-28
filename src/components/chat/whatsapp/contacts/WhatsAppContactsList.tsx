
import React from 'react';
import { useWhatsAppChatContext } from '../WhatsAppChatProvider';
import { ContactsList } from './ContactsList';

export const WhatsAppContactsList = () => {
  const {
    contacts,
    selectedContact,
    setSelectedContact,
    isLoadingContacts,
    isLoadingMoreContacts,
    hasMoreContacts,
    loadMoreContacts,
    totalContactsAvailable
  } = useWhatsAppChatContext();

  return (
    <ContactsList
      contacts={contacts}
      selectedContact={selectedContact}
      onContactSelect={setSelectedContact}
      searchQuery=""
      isLoading={isLoadingContacts}
    />
  );
};
