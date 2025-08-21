import React, { useState, useCallback } from 'react';
import { WhatsAppChatLayout } from './WhatsAppChatLayout';
import { useContacts } from '@/hooks/whatsapp/useContacts';
import { useMessages } from '@/hooks/whatsapp/useMessages';
import { useWhatsAppConnection } from '@/hooks/whatsapp/useWhatsAppConnection';
import { Contact, Message } from '@/types';

interface WhatsAppChatContainerProps {
  // Add any props if needed
}

const WhatsAppChatContainer: React.FC<WhatsAppChatContainerProps> = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const {
    contacts,
    isLoading,
    refreshContacts: handleRefreshContacts,
    deleteChat: handleDeleteChat,
    markAsRead: handleMarkAsRead,
    totalContactsAvailable
  } = useContacts();
  const {
    messages,
    sendMessage,
    loadMoreMessages,
    hasMoreMessages
  } = useMessages(selectedContact?.phone || '');
  const {
    isConnected,
    connectionStatus,
    connectWhatsApp,
    disconnectWhatsApp
  } = useWhatsAppConnection();

  const handleSelectContact = useCallback((contact: Contact) => {
    setSelectedContact(contact);
  }, []);

  const handleSendMessage = useCallback(
    async (messageText: string, mediaUrl?: string, mediaType?: string) => {
      if (selectedContact) {
        await sendMessage(selectedContact.phone, messageText, mediaUrl, mediaType);
      }
    },
    [selectedContact, sendMessage]
  );

  return (
    <WhatsAppChatLayout
      contacts={contacts}
      selectedContact={selectedContact}
      onSelectContact={handleSelectContact}
      messages={messages}
      onSendMessage={handleSendMessage}
      isConnected={isConnected}
      connectionStatus={connectionStatus}
      isLoading={isLoading}
      onRefreshContacts={handleRefreshContacts}
      onDeleteChat={handleDeleteChat}
      onMarkAsRead={handleMarkAsRead}
      onLoadMoreMessages={loadMoreMessages}
      hasMoreMessages={hasMoreMessages}
      totalContactsAvailable={totalContactsAvailable}
    />
  );
};

export default WhatsAppChatContainer;
