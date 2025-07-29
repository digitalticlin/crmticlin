
/**
 * 🎯 HOOK DE LISTA DE MENSAGENS COM ANIMAÇÕES
 * 
 * CORREÇÕES IMPLEMENTADAS:
 * ✅ Animações suaves para novas mensagens
 * ✅ Scroll inteligente baseado no contexto
 * ✅ Detecção melhorada de necessidade de scroll
 * ✅ Performance otimizada com refs
 */

import { useRef, useEffect, useMemo } from 'react';
import { Message } from '@/types/chat';

interface UseMessagesListProps {
  messages: Message[];
  isLoadingMore?: boolean;
}

export const useMessagesList = ({ messages, isLoadingMore }: UseMessagesListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);
  const shouldAutoScrollRef = useRef(true);

  // 🚀 CORREÇÃO: Função para verificar se está próximo do final
  const isNearBottom = (): boolean => {
    if (!containerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    return distanceFromBottom < 100; // 100px do final
  };

  // 🚀 CORREÇÃO: Scroll otimizado com animações
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior,
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  // 🚀 CORREÇÃO: Detectar quando aplicar animações
  const shouldShowAnimation = (message: Message, index: number): boolean => {
    const isNewMessage = (message as any).isNew;
    const isLastMessage = index === messages.length - 1;
    
    return isNewMessage || (isLastMessage && !message.fromMe);
  };

  // 🚀 CORREÇÃO: Scroll principal com detecção inteligente
  useEffect(() => {
    const currentLength = messages.length;
    const wasNewMessage = currentLength > prevMessagesLengthRef.current;
    const wasInitialLoad = isInitialLoadRef.current && currentLength > 0;
    
    const currentLastMessage = messages[currentLength - 1];
    const lastMessageChanged = currentLastMessage?.id !== prevLastMessageIdRef.current;
    
    // Atualizar refs
    prevMessagesLengthRef.current = currentLength;
    prevLastMessageIdRef.current = currentLastMessage?.id || null;

    // Carregamento inicial
    if (wasInitialLoad) {
      console.log('[useMessagesList] 🚀 Carregamento inicial');
      scrollToBottom('instant');
      isInitialLoadRef.current = false;
      return;
    }

    // Nova mensagem
    if (wasNewMessage && !isLoadingMore) {
      const lastMessage = messages[currentLength - 1];
      const isOwnMessage = lastMessage?.fromMe;
      
      // Auto-scroll para mensagens próprias ou se próximo do final
      const shouldScroll = isOwnMessage || (!isOwnMessage && isNearBottom());
      
      if (shouldScroll) {
        console.log('[useMessagesList] 📨 Auto-scroll para nova mensagem:', {
          isOwnMessage,
          behavior: isOwnMessage ? 'instant' : 'smooth'
        });
        
        // Mensagens próprias: scroll instantâneo
        // Mensagens externas: scroll suave
        setTimeout(() => {
          scrollToBottom(isOwnMessage ? 'instant' : 'smooth');
        }, 100); // Pequeno delay para animação
      }
    }

    // Atualização de mensagem (não fazer scroll)
    if (lastMessageChanged && !wasNewMessage) {
      console.log('[useMessagesList] 🔄 Mensagem atualizada - sem scroll');
    }

  }, [messages, isLoadingMore]);

  // 🚀 CORREÇÃO: Detectar scroll manual
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const nearBottom = isNearBottom();
      shouldAutoScrollRef.current = nearBottom;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 🚀 CORREÇÃO: Processar mensagens com flags de animação
  const messagesList = useMemo(() => {
    console.log('[useMessagesList] 📋 Processando mensagens:', {
      total: messages.length,
      primeira: messages[0]?.id?.substring(0, 8),
      ultima: messages[messages.length - 1]?.id?.substring(0, 8)
    });

    return messages.map((message, index) => ({
      ...message,
      shouldAnimate: shouldShowAnimation(message, index)
    }));
  }, [messages]);

  // 🚀 CORREÇÃO: Função para animar mensagem específica
  const animateMessage = (messageId: string) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.classList.add('animate-bounce');
      setTimeout(() => {
        messageElement.classList.remove('animate-bounce');
      }, 1000);
    }
  };

  return {
    messagesList,
    messagesEndRef,
    containerRef,
    scrollToBottom,
    animateMessage,
    shouldAutoScroll: shouldAutoScrollRef.current
  };
};
