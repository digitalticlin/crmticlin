import React, { memo, useMemo, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';
import { MessageMedia } from './messages/MessageMedia';

interface WhatsAppMessagesListProps {
  messages: Message[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMoreMessages?: boolean;
  onLoadMore?: () => Promise<void>;
}

// SCROLL INTELIGENTE - Detectar scroll para cima para carregar mais mensagens
const useScrollDetection = (
  containerRef: React.RefObject<HTMLDivElement>,
  onLoadMore?: () => Promise<void>,
  hasMoreMessages = false,
  isLoadingMore = false
) => {
  const [isNearTop, setIsNearTop] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onLoadMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtTop = scrollTop <= 100; // 100px do topo
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px do final

      setIsNearTop(isAtTop);

      // Carregar mais mensagens quando scroll está próximo do topo
      if (isAtTop && hasMoreMessages && !isLoadingMore) {
        // Salvar posição atual antes de carregar mais
        const currentScrollHeight = scrollHeight;
        const currentScrollTop = scrollTop;

        onLoadMore().then(() => {
          // Restaurar posição após carregar novas mensagens
          setTimeout(() => {
            const newScrollHeight = container.scrollHeight;
            const addedHeight = newScrollHeight - currentScrollHeight;
            container.scrollTop = currentScrollTop + addedHeight;
          }, 50);
        });
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, hasMoreMessages, isLoadingMore]);

  return { isNearTop };
};

// Componente memoizado para mensagem individual (simples e leve)
const MessageItem = memo(({ 
  message, 
  isNewMessage 
}: { 
  message: Message; 
  isNewMessage: boolean;
}) => {
  const isFromMe = message.fromMe || message.sender === "user";
  
  // Renderização de conteúdo otimizada
  const messageContent = useMemo(() => {
    const isRealMedia = message.mediaType && 
      message.mediaType !== 'text' && 
      ['image', 'video', 'audio', 'document'].includes(message.mediaType) &&
      message.mediaUrl;

    if (!isRealMedia) {
      return (
        <div className="space-y-1">
          {message.text && (
            <p className={cn(
              "text-sm leading-relaxed whitespace-pre-wrap break-words",
              isFromMe ? "text-white" : "text-gray-800"
            )}>
              {message.text}
            </p>
          )}
        </div>
      );
    }

    // Render mídia com componentes otimizados
    return (
      <div className="space-y-2">
        <MessageMedia
          messageId={message.id}
          mediaType={message.mediaType as any}
          mediaUrl={message.mediaUrl}
          fileName={message.text || undefined}
        />
        {message.text && message.text !== '[Mensagem de mídia]' && message.text !== '[Áudio]' && (
          <p className={cn(
            "text-sm leading-relaxed whitespace-pre-wrap break-words",
            isFromMe ? "text-white" : "text-gray-800"
          )}>
            {message.text}
          </p>
        )}
      </div>
    );
  }, [message.id, message.mediaType, message.mediaUrl, message.text, isFromMe]);

  return (
    <div className={cn(
      "flex mb-3 px-4 py-2 transition-all duration-200",
      isFromMe ? "justify-end" : "justify-start",
      isNewMessage && "animate-in slide-in-from-bottom-2 duration-300"
    )}>
      <div className={cn(
        "max-w-[80%] md:max-w-[70%] rounded-2xl p-3 shadow-sm",
        isFromMe 
          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md" 
          : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
      )}>
        {messageContent}
        <div className={cn(
          "text-xs mt-1 flex items-center justify-end space-x-1",
          isFromMe ? "text-blue-100" : "text-gray-500"
        )}>
          <span>{message.time}</span>
          {isFromMe && message.status && (
            <span className={cn(
              "material-icons text-xs",
              message.status === 'read' ? 'text-blue-200' : 'text-blue-300'
            )}>
              {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓' : '⏱'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export const WhatsAppMessagesList: React.FC<WhatsAppMessagesListProps> = memo(({
  messages,
  isLoading = false,
  isLoadingMore = false,
  hasMoreMessages = false,
  onLoadMore
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);
  const isInitialLoadRef = useRef(true);

  // Hook para detectar scroll e carregar mais mensagens
  const { isNearTop } = useScrollDetection(containerRef, onLoadMore, hasMoreMessages, isLoadingMore);

  // Scroll inteligente - apenas para mensagens novas no final
  useEffect(() => {
    const wasNewMessage = messages.length > prevMessagesLengthRef.current;
    const wasInitialLoad = isInitialLoadRef.current && messages.length > 0;
    
    prevMessagesLengthRef.current = messages.length;

    if ((wasNewMessage || wasInitialLoad) && messagesEndRef.current && !isLoadingMore) {
      // Scroll suave para o final apenas para mensagens novas ou carregamento inicial
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: wasInitialLoad ? 'instant' : 'smooth',
          block: 'end'
        });
      }, 100);
      
      if (wasInitialLoad) {
        isInitialLoadRef.current = false;
      }
    }
  }, [messages.length, isLoadingMore]);

  // Memoizar lista de mensagens (ORDEM CORRETA: antigas no topo, recentes no final)
  const messagesList = useMemo(() => {
    // Mensagens já vêm na ordem correta do hook (mais antigas primeiro para exibição)
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return sortedMessages.map((message, index) => {
      const isNewMessage = index === sortedMessages.length - 1; // Última mensagem é a mais nova
      
      return (
        <MessageItem
          key={message.id}
          message={message}
          isNewMessage={isNewMessage}
        />
      );
    });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Carregando mensagens...</span>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <div className="mb-2">💬</div>
          <p>Nenhuma mensagem ainda</p>
          <p className="text-sm">Inicie uma conversa!</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto pb-4 scroll-smooth"
      style={{ 
        scrollBehavior: 'smooth',
        overflowAnchor: 'none'
      }}
    >
      {/* Indicador de carregamento no topo */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-400"></div>
            <span>Carregando mensagens anteriores...</span>
          </div>
        </div>
      )}
      
      {/* Indicador de fim das mensagens */}
      {!hasMoreMessages && messages.length > 20 && (
        <div className="flex justify-center py-2">
          <span className="text-xs text-gray-400">• • • Início da conversa • • •</span>
        </div>
      )}

      {messagesList}
      
      {/* Elemento para scroll automático */}
      <div ref={messagesEndRef} />
    </div>
  );
});

WhatsAppMessagesList.displayName = 'WhatsAppMessagesList';
