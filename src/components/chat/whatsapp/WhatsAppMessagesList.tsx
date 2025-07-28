
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

  console.log('[WhatsAppMessagesList] 📋 Renderizando:', {
    total: messages.length,
    messagesList: messagesList.length,
    isLoading,
    isLoadingMore
  });

  // ✅ ESTADO VAZIO - APENAS SE NÃO ESTÁ CARREGANDO
  if (!isLoading && messages.length === 0) {
    return <EmptyMessagesState />;
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
      {/* ✅ LOADING OVERLAY - NÃO SUBSTITUI O CONTEÚDO */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <MessagesLoadingIndicator />
        </div>
      )}

      {/* Indicador de carregamento no topo */}
      {isLoadingMore && <LoadMoreIndicator />}
      
      {/* Indicador de início da conversa */}
      <ConversationStartIndicator 
        hasMoreMessages={hasMoreMessages}
        messagesCount={messages.length}
      />

      {/* Lista de mensagens */}
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
