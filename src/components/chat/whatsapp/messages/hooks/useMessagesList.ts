
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
  const scrollTriesRef = useRef(0);
  const MAX_SCROLL_TRIES = 4;

  // ✅ FUNÇÃO DE SCROLL OTIMIZADA
  const scrollToBottom = useRef((behavior: 'instant' | 'smooth' = 'smooth', attempt: number = 0) => {
    if (!messagesEndRef.current) return;
    
    try {
      messagesEndRef.current.scrollIntoView({ 
        behavior,
        block: 'end',
        inline: 'nearest'
      });
      
      console.log(`[useMessagesList] 📍 Scroll ${behavior} - tentativa ${attempt + 1}`);
    } catch (error) {
      console.warn('[useMessagesList] ⚠️ Erro no scroll:', error);
    }
  }).current;

  // ✅ SCROLL AUTOMÁTICO OTIMIZADO COM MÚLTIPLAS TENTATIVAS
  useEffect(() => {
    const wasNewMessage = messages.length > prevMessagesLengthRef.current;
    const wasInitialLoad = isInitialLoadRef.current && messages.length > 0;
    
    // Verificar se houve mudança na última mensagem
    const currentLastMessage = messages[messages.length - 1];
    const lastMessageChanged = currentLastMessage?.id !== prevLastMessageIdRef.current;
    
    // Atualizar refs
    prevMessagesLengthRef.current = messages.length;
    prevLastMessageIdRef.current = currentLastMessage?.id || null;

    // ✅ SCROLL IMEDIATO PARA CARREGAMENTO INICIAL
    if (wasInitialLoad) {
      console.log('[useMessagesList] 🚀 Carregamento inicial - scroll instantâneo');
      scrollTriesRef.current = 0;
      
      // Múltiplas tentativas de scroll com timing otimizado
      const scrollAttempts = [0, 50, 150, 300];
      
      scrollAttempts.forEach((delay, index) => {
        setTimeout(() => {
          if (scrollTriesRef.current < MAX_SCROLL_TRIES) {
            scrollToBottom('instant', index);
            scrollTriesRef.current++;
          }
        }, delay);
      });
      
      isInitialLoadRef.current = false;
      return;
    }

    // ✅ SCROLL SUAVE PARA NOVAS MENSAGENS
    if ((wasNewMessage || lastMessageChanged) && !isLoadingMore) {
      console.log('[useMessagesList] 📨 Nova mensagem - scroll suave');
      
      setTimeout(() => {
        scrollToBottom('smooth');
      }, 100);
    }
  }, [messages, isLoadingMore, scrollToBottom]);

  // ✅ SCROLL INICIAL GARANTIDO
  useEffect(() => {
    if (messages.length > 0) {
      // Garantir que o scroll inicial aconteça mesmo se outras condições falharem
      setTimeout(() => {
        scrollToBottom('instant');
      }, 50);
    }
  }, []); // Executa apenas na montagem

  // ✅ MENSAGENS MEMOIZADAS
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
