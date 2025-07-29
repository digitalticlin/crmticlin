
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

  // Hook para detectar scroll e carregar mais mensagens
  const { isNearTop } = useScrollDetection({
    containerRef, 
    onLoadMore, 
    hasMoreMessages, 
    isLoadingMore
  });

  // Hook para gerenciar lista de mensagens
  const { messagesList, messagesEndRef } = useMessagesList({
    messages,
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
      className="flex-1 overflow-y-auto pb-4 scroll-smooth"
      style={{ 
        scrollBehavior: 'smooth',
        overflowAnchor: 'none',
        // Otimizações para scroll automático
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
      {messagesList.map((message, index) => {
        const isNewMessage = index === messagesList.length - 1; // Última mensagem é a mais nova
        
        return (
          <MessageItem
            key={message.id}
            message={message}
            isNewMessage={isNewMessage}
          />
        );
      })}
      
      {/* Elemento para scroll automático - mais robusto */}
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
