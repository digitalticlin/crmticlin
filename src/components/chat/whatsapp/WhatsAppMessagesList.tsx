
import React, { memo, useRef } from 'react';
import { Message } from '@/types/chat';
import { useScrollDetection } from './messages/hooks/useScrollDetection';
import { useMessagesList } from './messages/hooks/useMessagesList';
import { MessageItem } from './messages/components/MessageItem';
import { MessagesLoadingIndicator } from './messages/components/MessagesLoadingIndicator';
import { LoadMoreIndicator } from './messages/components/LoadMoreIndicator';
import { EmptyMessagesState } from './messages/components/EmptyMessagesState';
import { ConversationStartIndicator } from './messages/components/ConversationStartIndicator';

interface WhatsAppMessagesListProps {
  messages: Message[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMoreMessages?: boolean;
  onLoadMore?: () => Promise<void>;
}

export const WhatsAppMessagesList: React.FC<WhatsAppMessagesListProps> = memo(({
  messages,
  isLoading = false,
  isLoadingMore = false,
  hasMoreMessages = false,
  onLoadMore
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { isNearTop } = useScrollDetection({
    containerRef, 
    onLoadMore, 
    hasMoreMessages, 
    isLoadingMore
  });

  const { messagesList, messagesEndRef } = useMessagesList({
    messages,
    isLoadingMore
  });

  console.log('[WhatsAppMessagesList] 📋 Renderizando:', {
    total: messages.length,
    messagesList: messagesList.length,
    isLoading,
    isLoadingMore
  });

  if (!isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 opacity-50">
            <svg viewBox="0 0 24 24" className="w-full h-full fill-current text-gray-400">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhuma mensagem
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Inicie uma conversa enviando uma mensagem
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto pb-4 scroll-smooth relative"
      style={{ 
        scrollBehavior: 'smooth',
        overflowAnchor: 'none',
        scrollPaddingBottom: '16px'
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <MessagesLoadingIndicator />
        </div>
      )}

      {isLoadingMore && <LoadMoreIndicator />}
      
      <ConversationStartIndicator 
        hasMoreMessages={hasMoreMessages}
        messagesCount={messages.length}
      />

      <div className="space-y-2 px-4">
        {messagesList.map((message, index) => {
          const isNewMessage = index === messagesList.length - 1;
          
          return (
            <MessageItem
              key={message.id}
              message={message}
              isNewMessage={isNewMessage}
            />
          );
        })}
      </div>
      
      <div 
        ref={messagesEndRef} 
        className="h-4 w-full" 
        style={{ 
          scrollMarginBottom: '16px',
          clear: 'both' 
        }}
        aria-hidden="true"
      />
    </div>
  );
});

WhatsAppMessagesList.displayName = 'WhatsAppMessagesList';
