
import React, { memo, useMemo } from 'react';
import { Message } from '@/types/chat';
import { useScrollDetection } from './messages/hooks/useScrollDetection';
import { useMessagesList } from './messages/hooks/useMessagesList';
import { MessageItem } from './messages/components/MessageItem';
import { MessagesLoadingIndicator } from './messages/components/MessagesLoadingIndicator';
import { LoadMoreIndicator } from './messages/components/LoadMoreIndicator';
import { EmptyMessagesState } from './messages/components/EmptyMessagesState';
import { ConversationStartIndicator } from './messages/components/ConversationStartIndicator';
import { DateSeparator } from './messages/components/DateSeparator';
import { isSameDay } from 'date-fns';

interface WhatsAppMessagesListProps {
  messages: Message[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMoreMessages?: boolean;
  onLoadMore?: () => Promise<void>;
}

// 🚀 CORREÇÃO: Função para agrupar mensagens por data
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

export const WhatsAppMessagesList: React.FC<WhatsAppMessagesListProps> = memo(({
  messages,
  isLoading = false,
  isLoadingMore = false,
  hasMoreMessages = false,
  onLoadMore
}) => {
  // Hook para gerenciar lista de mensagens com animações
  const { messagesList, messagesEndRef, containerRef, scrollToBottom } = useMessagesList({
    messages,
    isLoadingMore
  });

  // Hook para detectar scroll e carregar mais mensagens
  const { isNearTop, isNearBottom } = useScrollDetection({
    containerRef, 
    onLoadMore, 
    hasMoreMessages, 
    isLoadingMore
  });

  // 🚀 CORREÇÃO: Agrupar mensagens por data
  const messageGroups = useMemo(() => groupMessagesByDate(messagesList), [messagesList]);

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

      {/* 🚀 CORREÇÃO: Lista de mensagens agrupadas por data */}
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
                <MessageItem
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

WhatsAppMessagesList.displayName = 'WhatsAppMessagesList';
