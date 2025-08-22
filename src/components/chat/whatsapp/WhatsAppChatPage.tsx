
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

  const handleSendMessage = async (message: string, mediaType?: string, mediaUrl?: string): Promise<boolean> => {
    try {
      // Implementation would handle message sending
      console.log('Sending message:', { message, mediaType, mediaUrl });
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  return (
    <WhatsAppChatLayout
      contacts={contacts}
      selectedContact={selectedContact}
      onSelectContact={setSelectedContact}
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoadingContacts={isLoadingContacts}
      isLoadingMoreContacts={false}
      hasMoreContacts={false}
      onLoadMoreContacts={async () => {}}
      isLoadingMessages={isLoadingMessages}
      isLoadingMore={false}
      hasMoreMessages={false}
      onLoadMoreMessages={async () => {}}
      isSending={false}
      onRefreshMessages={refreshMessages}
      onRefreshContacts={refreshContacts}
      totalContactsAvailable={contacts.length}
      onSearchContacts={async () => {}}
    />
  );
};
