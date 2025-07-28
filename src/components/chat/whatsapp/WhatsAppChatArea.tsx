
import React from 'react';
import { WhatsAppMessagesList } from './WhatsAppMessagesList';
import { WhatsAppMessageInput } from './WhatsAppMessageInput';
import { WhatsAppChatHeader } from './WhatsAppChatHeader';
import { useWhatsAppChatContext } from './WhatsAppChatProvider';

export const WhatsAppChatArea = () => {
  const {
    selectedContact,
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    isSending,
    sendMessage,
    loadMoreMessages,
    realtimeStats
  } = useWhatsAppChatContext();

  if (!selectedContact) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Selecione um contato
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Escolha um contato da lista para iniciar uma conversa
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 h-full">
      <WhatsAppChatHeader contact={selectedContact} />
      
      <WhatsAppMessagesList
        messages={messages}
        isLoading={isLoadingMessages}
        isLoadingMore={isLoadingMore}
        hasMoreMessages={hasMoreMessages}
        onLoadMore={loadMoreMessages}
      />
      
      <WhatsAppMessageInput
        onSendMessage={sendMessage}
        isSending={isSending}
        realtimeStats={realtimeStats?.messagesRealtimeStats}
      />
    </div>
  );
};
