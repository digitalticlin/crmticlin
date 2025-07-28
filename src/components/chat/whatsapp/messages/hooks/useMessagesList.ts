
import { useRef, useEffect, useMemo } from 'react';
import { Message } from '@/types/chat';

interface UseMessagesListProps {
  messages: Message[];
  isLoadingMore?: boolean;
}

export const useMessagesList = ({ messages, isLoadingMore }: UseMessagesListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  const scrollToBottom = useRef(() => {
    if (!messagesEndRef.current) return;
    
    try {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'instant',
        block: 'end',
        inline: 'nearest'
      });
      
      console.log('[useMessagesList] 📍 Scroll executado');
    } catch (error) {
      console.warn('[useMessagesList] ⚠️ Erro no scroll:', error);
    }
  }).current;

  useEffect(() => {
    const wasNewMessage = messages.length > prevMessagesLengthRef.current;
    const wasInitialLoad = isInitialLoadRef.current && messages.length > 0;
    
    const currentLastMessage = messages[messages.length - 1];
    const lastMessageChanged = currentLastMessage?.id !== prevLastMessageIdRef.current;
    
    prevMessagesLengthRef.current = messages.length;
    prevLastMessageIdRef.current = currentLastMessage?.id || null;

    if (wasInitialLoad) {
      console.log('[useMessagesList] 🚀 Carregamento inicial - scroll instantâneo');
      
      setTimeout(() => scrollToBottom(), 0);
      setTimeout(() => scrollToBottom(), 100);
      setTimeout(() => scrollToBottom(), 300);
      
      isInitialLoadRef.current = false;
      return;
    }

    if ((wasNewMessage || lastMessageChanged) && !isLoadingMore) {
      console.log('[useMessagesList] 📨 Nova mensagem - scroll automático');
      
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages.length, isLoadingMore, scrollToBottom]);

  const messagesList = useMemo(() => {
    if (messages.length === 0) return [];
    
    console.log('[useMessagesList] 📋 Processando mensagens:', {
      total: messages.length,
      primeira: messages[0]?.id?.substring(0, 8) || 'N/A',
      ultima: messages[messages.length - 1]?.id?.substring(0, 8) || 'N/A'
    });

    return messages;
  }, [messages]);

  return {
    messagesList,
    messagesEndRef
  };
};
