
import { useMemo, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';

interface UseMessagesListProps {
  messages: Message[];
  isLoadingMore: boolean;
}

export const useMessagesList = ({ messages, isLoadingMore }: UseMessagesListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);
  const isInitialLoadRef = useRef(true);

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

    return sortedMessages;
  }, [messages]);

  return {
    messagesList,
    messagesEndRef
  };
};
