
import React, { memo, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import { Message } from '@/types/chat';
import { useScrollDetection } from './messages/hooks/useScrollDetection';
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

// 🚀 CORRIGIDO: Mensagens já chegam em ordem cronológica correta (antigas→recentes)
const groupMessagesByDate = (messages: Message[]) => {
  // Mensagens já chegam ordenadas cronologicamente (antigas→recentes)
  const chronologicalMessages = messages;
  
  const groups: { date: Date; messages: Message[] }[] = [];
  
  chronologicalMessages.forEach((message) => {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  console.log('[WhatsApp MessagesList] 📋 Renderizando lista:', {
    total: messages.length,
    isLoading,
    isLoadingMore,
    hasMoreMessages
  });

  // Hook para detectar scroll e carregar mais mensagens
  const { isNearTop, isNearBottom } = useScrollDetection({
    containerRef, 
    onLoadMore, 
    hasMoreMessages, 
    isLoadingMore
  });

  // 🚀 PRE-POSITIONED: Posicionamento direto sem scroll visível
  const positionAtBottom = useCallback(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      // Posicionamento DIRETO sem qualquer animação
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // 🚀 CORREÇÃO: Agrupar mensagens por data - direto das props
  const messageGroups = useMemo(() => groupMessagesByDate(messages), [messages]);

  // 🚀 PRE-POSITIONED: useLayoutEffect executa ANTES do paint do browser
  useLayoutEffect(() => {
    if (messages.length > 0) {
      console.log('[WhatsApp MessagesList] ⚡ PRE-POSITIONED: Posicionando antes do paint');
      positionAtBottom();
    }
  }, [messages.length, positionAtBottom]);

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
        scrollBehavior: 'auto', // PRE-POSITIONED: sem animação
        overflowAnchor: 'auto', // PRE-POSITIONED: permitir ancoragem para estabilidade
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
