
import React, { memo } from 'react';
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
  // Hook para gerenciar lista de mensagens com scroll inteligente
  const { messagesList, messagesEndRef, containerRef } = useMessagesList({
    messages,
    isLoadingMore
  });

  // Hook para detectar scroll e carregar mais mensagens
  const { isNearTop } = useScrollDetection({
    containerRef, 
    onLoadMore, 
    hasMoreMessages, 
    isLoadingMore
  });

  if (isLoading) {
    return <MessagesLoadingIndicator />;
  }

  if (messages.length === 0) {
    return <EmptyMessagesState />;
  }

  return (
    <div 
      ref={containerRef}
      className="pb-4 px-4 glass-scrollbar"
      style={{ 
        height: 'calc(100vh - 280px)',
        overflowY: 'auto',
        scrollBehavior: 'smooth',
        overflowAnchor: 'none',
        scrollPaddingBottom: '16px'
      }}
    >
      {/* Indicador de carregamento no topo */}
      {isLoadingMore && <LoadMoreIndicator />}
      
      {/* Indicador de fim das mensagens */}
      <ConversationStartIndicator 
        hasMoreMessages={hasMoreMessages}
        messagesCount={messages.length}
      />

      {/* Lista de mensagens */}
      <div className="px-2">
        {messagesList.map((message, index) => {
          const isLastMessage = index === messagesList.length - 1;
          
          return (
            <MessageItem
              key={message.id}
              message={message}
              isLastMessage={isLastMessage}
            />
          );
        })}
      </div>
      
      {/* Elemento para scroll automático */}
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
