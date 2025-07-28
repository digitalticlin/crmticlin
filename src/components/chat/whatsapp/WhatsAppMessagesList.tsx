
import React, { memo } from 'react';
import { Message } from '@/types/chat';
import { useScrollDetection } from './messages/hooks/useScrollDetection';
import { useMessagesList } from './messages/hooks/useMessagesList';
import { MessageItem } from './messages/components/MessageItem';
import { MessagesLoadingIndicator } from './messages/components/MessagesLoadingIndicator';
import { LoadMoreIndicator } from './messages/components/LoadMoreIndicator';
import { EmptyMessagesState } from './messages/components/EmptyMessagesState';
import { ConversationStartIndicator } from './messages/components/ConversationStartIndicator';
import { cn } from '@/lib/utils';

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
  const containerRef = React.useRef<HTMLDivElement>(null);

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

  console.log('[WhatsAppMessagesList] 📋 Renderizando otimizado:', {
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
      {/* ✅ SKELETON LOADING - APENAS CARREGAMENTO INICIAL */}
      {isLoading && messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
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

      {/* Lista de mensagens com animações otimizadas */}
      <div className="space-y-2 px-4">
        {messagesList.map((message, index) => {
          const isNewMessage = index === messagesList.length - 1;
          const isOptimistic = (message as any).isOptimistic;
          
          return (
            <div
              key={message.id}
              className={cn(
                "transition-all duration-300 ease-in-out",
                isNewMessage && !isOptimistic && "animate-in slide-in-from-bottom-2 duration-300",
                isOptimistic && "opacity-80 animate-pulse"
              )}
            >
              <MessageItem
                message={message}
                isNewMessage={isNewMessage}
              />
            </div>
          );
        })}
      </div>
      
      {/* Elemento para scroll automático otimizado */}
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
