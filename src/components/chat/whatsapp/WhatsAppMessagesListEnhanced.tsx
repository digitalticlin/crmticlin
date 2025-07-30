
import React, { memo, useMemo } from 'react';
import { Message } from '@/types/chat';
import { useScrollDetection } from './messages/hooks/useScrollDetection';
import { useMessagesList } from './messages/hooks/useMessagesList';
import { MessageItemEnhanced } from './messages/components/MessageItemEnhanced';
import { MessagesLoadingIndicator } from './messages/components/MessagesLoadingIndicator';
import { LoadMoreIndicator } from './messages/components/LoadMoreIndicator';
import { EmptyMessagesState } from './messages/components/EmptyMessagesState';
import { ConversationStartIndicator } from './messages/components/ConversationStartIndicator';
import { isSameDay } from 'date-fns';

interface WhatsAppMessagesListEnhancedProps {
  messages: Message[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMoreMessages?: boolean;
  onLoadMore?: () => Promise<void>;
}

// Helper para agrupar mensagens por data
const groupMessagesByDate = (messages: Message[]) => {
  const groups: { date: Date; messages: Message[] }[] = [];
  
  messages.forEach((message) => {
    const messageDate = new Date(message.timestamp);
    const lastGroup = groups[groups.length - 1];
    
    if (!lastGroup || !isSameDay(lastGroup.date, messageDate)) {
      groups.push({ date: messageDate, messages: [message] });
    } else {
      lastGroup.messages.push(message);
    }
  });
  
  return groups;
};

// Componente para separador de data
const DateSeparator = React.memo(({ date }: { date: Date }) => (
  <div className="flex justify-center my-4">
    <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
      {date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}
    </div>
  </div>
));

export const WhatsAppMessagesListEnhanced: React.FC<WhatsAppMessagesListEnhancedProps> = memo(({
  messages,
  isLoading = false,
  isLoadingMore = false,
  hasMoreMessages = false,
  onLoadMore
}) => {
  // Hook para gerenciar lista de mensagens com animações
  const { messagesList, messagesEndRef, containerRef } = useMessagesList({
    messages,
    isLoadingMore
  });

  // Hook para detectar scroll e carregar mais mensagens
  const { } = useScrollDetection({
    containerRef, 
    onLoadMore, 
    hasMoreMessages, 
    isLoadingMore
  });

  // Agrupar mensagens por data
  const messageGroups = useMemo(() => groupMessagesByDate(messagesList), [messagesList]);

  // ✅ LOG PARA DEBUG DE MÍDIA
  React.useEffect(() => {
    const mediaMessages = messages.filter(m => m.mediaType !== 'text');
    const withCache = mediaMessages.filter(m => m.hasMediaCache);
    
    if (mediaMessages.length > 0) {
      console.log(`[WhatsAppMessagesListEnhanced] 📊 Estatísticas de mídia:`, {
        total: messages.length,
        media: mediaMessages.length,
        withCache: withCache.length,
        cacheRate: `${Math.round((withCache.length / mediaMessages.length) * 100)}%`
      });
    }
  }, [messages]);

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

      {/* Lista de mensagens agrupadas por data */}
      <div className="space-y-1">
        {messageGroups.map((group, groupIndex) => (
          <div key={group.date.toISOString()}>
            {/* Separador de data */}
            <DateSeparator date={group.date} />
            
            {/* Mensagens do grupo */}
            {group.messages.map((message, messageIndex) => {
              const isLastMessage = groupIndex === messageGroups.length - 1 && 
                                  messageIndex === group.messages.length - 1;
              
              return (
                <MessageItemEnhanced
                  key={message.id}
                  message={message}
                  isLastMessage={isLastMessage}
                />
              );
            })}
          </div>
        ))}
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

WhatsAppMessagesListEnhanced.displayName = 'WhatsAppMessagesListEnhanced';
