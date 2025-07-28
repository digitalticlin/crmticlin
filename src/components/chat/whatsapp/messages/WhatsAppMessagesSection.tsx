
import React from 'react';
import { useWhatsAppChatContext } from '../WhatsAppChatProvider';
import { MessagesList } from './MessagesList';
import { MessageInput } from './MessageInput';
import { EmptyMessages } from './EmptyMessages';

export const WhatsAppMessagesSection = () => {
  const { 
    selectedContact, 
    messages, 
    isLoadingMessages, 
    sendMessage, 
    isSending,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore
  } = useWhatsAppChatContext();

  if (!selectedContact) {
    return <EmptyMessages />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto">
        <MessagesList
          messages={messages}
          isLoading={isLoadingMessages}
          loadMoreMessages={loadMoreMessages}
          hasMoreMessages={hasMoreMessages}
          isLoadingMore={isLoadingMore}
        />
      </div>

      {/* Message Input */}
      <div className="border-t bg-white p-4">
        <MessageInput
          onSendMessage={sendMessage}
          isSending={isSending}
          contactName={selectedContact.name}
        />
      </div>
    </div>
  );
};
