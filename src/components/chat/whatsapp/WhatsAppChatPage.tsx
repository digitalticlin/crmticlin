
import React from 'react';
import { WhatsAppChatLayout } from './WhatsAppChatLayout';
import { useWhatsAppChat } from '@/hooks/whatsapp/useWhatsAppChat';

export const WhatsAppChatPage = () => {
  const {
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    isLoadingContacts,
    isLoadingMessages,
    refreshContacts,
    refreshMessages,
    markAsRead,
    instanceHealth
  } = useWhatsAppChat();

  return (
    <WhatsAppChatLayout
      contacts={contacts}
      selectedContact={selectedContact}
      onSelectContact={setSelectedContact}
      messages={messages}
      isLoadingContacts={isLoadingContacts}
      isLoadingMessages={isLoadingMessages}
      onRefreshContacts={refreshContacts}
      onRefreshMessages={refreshMessages}
      onMarkAsRead={markAsRead}
      instanceHealth={instanceHealth}
      searchTerm=""
      onSearchChange={() => {}}
      hasMoreContacts={false}
      hasMoreMessages={false}
      onLoadMoreContacts={async () => {}}
      onLoadMoreMessages={async () => {}}
    />
  );
};
