
/**
 * 🎯 HOOK DE LISTA DE MENSAGENS SEM AUTO-REFRESH
 * 
 * CORREÇÕES IMPLEMENTADAS:
 * ✅ Removido auto-scroll automático desnecessário
 * ✅ Scroll apenas para mensagens próprias ou quando no final
 * ✅ Detecção inteligente de mensagens realmente novas
 * ✅ Preservação da posição do scroll
 */

import { useRef, useEffect, useMemo, useCallback } from 'react';
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
  const lastScrollPositionRef = useRef<number>(0);
  const userScrolledAwayRef = useRef(false);

  // 🚀 CORREÇÃO: Função para verificar se está próximo do final
  const isNearBottom = useCallback((): boolean => {
    if (!containerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    return distanceFromBottom < 100; // 100px do final
  }, []);

  // 🚀 CORREÇÃO: Scroll otimizado sem conflitos
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current && containerRef.current) {
      const container = containerRef.current;
      
      container.scrollTo({
        top: container.scrollHeight,
        behavior
      });
      
      lastScrollPositionRef.current = container.scrollHeight;
      userScrolledAwayRef.current = false;
    }
  }, []);

  // 🚀 CORREÇÃO: Detectar se mensagem é realmente nova (não refresh)
  const isReallyNewMessage = useCallback((currentLength: number, currentLastMessage?: Message): boolean => {
    const wasNewMessage = currentLength > prevMessagesLengthRef.current;
    const lastMessageChanged = currentLastMessage?.id !== prevLastMessageIdRef.current;
    
    // Nova mensagem: mais itens na lista E último ID diferente
    return wasNewMessage && lastMessageChanged && !isLoadingMore;
  }, [isLoadingMore]);

  // 🚀 CORREÇÃO: Detectar scroll manual do usuário
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const isUserScrolling = Math.abs(currentScrollTop - lastScrollPositionRef.current) > 10;
      
      if (isUserScrolling && !isNearBottom()) {
        userScrolledAwayRef.current = true;
      } else if (isNearBottom()) {
        userScrolledAwayRef.current = false;
      }
      
      lastScrollPositionRef.current = currentScrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isNearBottom]);

  // 🚀 CORREÇÃO: Lógica de scroll APENAS para casos específicos
  useEffect(() => {
    const currentLength = messages.length;
    const currentLastMessage = messages[currentLength - 1];
    
    // Carregamento inicial - scroll instantâneo
    if (isInitialLoadRef.current && currentLength > 0) {
      console.log('[useMessagesList] 🚀 Carregamento inicial - scroll para baixo');
      scrollToBottom('instant');
      isInitialLoadRef.current = false;
      
      // Atualizar refs
      prevMessagesLengthRef.current = currentLength;
      prevLastMessageIdRef.current = currentLastMessage?.id || null;
      return;
    }

    // Verificar se é mensagem realmente nova
    const isNewMessage = isReallyNewMessage(currentLength, currentLastMessage);
    
    if (isNewMessage) {
      const isOwnMessage = currentLastMessage?.fromMe;
      const shouldScroll = isOwnMessage || (!userScrolledAwayRef.current && isNearBottom());
      
      if (shouldScroll) {
        console.log('[useMessagesList] 📨 Nova mensagem - auto-scroll:', {
          isOwnMessage,
          userScrolledAway: userScrolledAwayRef.current,
          behavior: isOwnMessage ? 'instant' : 'smooth'
        });
        
        // Pequeno delay para permitir renderização da mensagem
        setTimeout(() => {
          scrollToBottom(isOwnMessage ? 'instant' : 'smooth');
        }, 50);
      } else {
        console.log('[useMessagesList] 📨 Nova mensagem - usuário rolou para cima, sem scroll');
      }
    }

    // Atualizar refs
    prevMessagesLengthRef.current = currentLength;
    prevLastMessageIdRef.current = currentLastMessage?.id || null;

  }, [messages, isReallyNewMessage, scrollToBottom, isNearBottom]);

  // 🚀 CORREÇÃO: Processar mensagens sem flags desnecessárias
  const messagesList = useMemo(() => {
    console.log('[useMessagesList] 📋 Processando mensagens:', {
      total: messages.length,
      isLoadingMore,
      userScrolledAway: userScrolledAwayRef.current
    });

    return messages; // Retornar mensagens sem processamento adicional
  }, [messages, isLoadingMore]);

  // Função para scroll manual (botão ou ação do usuário)
  const scrollToBottomManual = useCallback(() => {
    console.log('[useMessagesList] 👆 Scroll manual acionado');
    userScrolledAwayRef.current = false;
    scrollToBottom('smooth');
  }, [scrollToBottom]);

  return {
    messagesList,
    messagesEndRef,
    containerRef,
    scrollToBottom: scrollToBottomManual,
    isNearBottom: isNearBottom(),
    userScrolledAway: userScrolledAwayRef.current
  };
};
