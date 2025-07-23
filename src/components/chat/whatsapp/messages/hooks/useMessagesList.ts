
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

  // Scroll automático otimizado - sempre para o final com novas mensagens
  useEffect(() => {
    const wasNewMessage = messages.length > prevMessagesLengthRef.current;
    const wasInitialLoad = isInitialLoadRef.current && messages.length > 0;
    
    // Verificar se houve mudança na última mensagem (nova mensagem ou atualização)
    const currentLastMessage = messages[messages.length - 1];
    const lastMessageChanged = currentLastMessage?.id !== prevLastMessageIdRef.current;
    
    // Atualizar refs
    prevMessagesLengthRef.current = messages.length;
    prevLastMessageIdRef.current = currentLastMessage?.id || null;

    // ✅ CORREÇÃO: Para carregamento inicial, ir INSTANTANEAMENTE para o final
    if (wasInitialLoad && messagesEndRef.current) {
      console.log('[useMessagesList] 🚀 Carregamento inicial - ir direto para o final');
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'instant', // SEMPRE instantâneo para carregamento inicial
            block: 'end',
            inline: 'nearest'
          });
        }
      }, 0); // Imediato
      
      isInitialLoadRef.current = false;
      return; // Sair aqui para não fazer scroll duplo
    }

    // Para novas mensagens ou atualizações, scroll suave
    const shouldScroll = (wasNewMessage || lastMessageChanged) && 
                        messagesEndRef.current && 
                        !isLoadingMore;

    if (shouldScroll) {
      console.log('[useMessagesList] 🔽 Scroll automático para nova mensagem:', {
        wasNewMessage,
        lastMessageChanged,
        messagesCount: messages.length
      });

      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'smooth', // Suave apenas para novas mensagens
            block: 'end',
            inline: 'nearest'
          });
        }
      }, 50);
    }
  }, [messages, isLoadingMore]);

  // ✅ GARANTIR scroll inicial quando componente monta
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      console.log('[useMessagesList] 🎯 Scroll inicial garantido');
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'instant',
        block: 'end' 
      });
    }
  }, []); // Só executa na montagem

  // Memoizar lista de mensagens (ORDEM CORRETA: antigas no topo, recentes no final)
  const messagesList = useMemo(() => {
    // Mensagens já vêm na ordem correta do hook (mais antigas primeiro para exibição)
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
    );

    return sortedMessages;
  }, [messages]);

  return {
    messagesList,
    messagesEndRef
  };
};
