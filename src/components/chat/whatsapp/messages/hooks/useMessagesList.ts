
/**
 * 🎯 HOOK DE SCROLL CORRIGIDO - FLUIDO E INTELIGENTE
 * 
 * CORREÇÕES:
 * ✅ Scroll inteligente baseado no tipo de mensagem
 * ✅ Sem múltiplos backups desnecessários
 * ✅ Detecção de necessidade de scroll
 * ✅ Scroll suave apenas para mensagens externas
 */

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
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ SCROLL INTELIGENTE: Detectar quando scroll é necessário
  const shouldAutoScroll = useRef(true);

  // ✅ FUNÇÃO AUXILIAR: Verificar se está próximo do final
  const isNearBottom = (): boolean => {
    if (!containerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    return distanceFromBottom < 100; // 100px do final
  };

  // ✅ FUNÇÃO AUXILIAR: Scroll otimizado
  const scrollToBottom = (behavior: 'instant' | 'smooth' = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior,
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  // ✅ SCROLL PRINCIPAL: Inteligente e fluido
  useEffect(() => {
    const currentLength = messages.length;
    const wasNewMessage = currentLength > prevMessagesLengthRef.current;
    const wasInitialLoad = isInitialLoadRef.current && currentLength > 0;
    
    // Verificar se houve mudança na última mensagem
    const currentLastMessage = messages[currentLength - 1];
    const lastMessageChanged = currentLastMessage?.id !== prevLastMessageIdRef.current;
    
    // Atualizar refs
    prevMessagesLengthRef.current = currentLength;
    prevLastMessageIdRef.current = currentLastMessage?.id || null;

    // ✅ CARREGAMENTO INICIAL: Scroll instantâneo
    if (wasInitialLoad) {
      console.log('[useMessagesList] 🚀 Carregamento inicial - scroll instantâneo');
      scrollToBottom('instant');
      isInitialLoadRef.current = false;
      return;
    }

    // ✅ NOVA MENSAGEM: Scroll apenas se necessário
    if (wasNewMessage && !isLoadingMore) {
      const lastMessage = messages[currentLength - 1];
      const isOwnMessage = lastMessage?.fromMe;
      const isOptimistic = lastMessage?.id?.startsWith('temp_');
      
      // Scroll automático apenas se:
      // 1. É mensagem própria (sempre scroll)
      // 2. É mensagem externa E usuário está próximo do final
      const shouldScroll = isOwnMessage || (!isOwnMessage && isNearBottom());
      
      if (shouldScroll) {
        console.log('[useMessagesList] 🔽 Scroll automático:', {
          isOwnMessage,
          isOptimistic,
          behavior: isOwnMessage ? 'instant' : 'smooth'
        });
        
        // Mensagens próprias: scroll instantâneo
        // Mensagens externas: scroll suave
        scrollToBottom(isOwnMessage ? 'instant' : 'smooth');
      }
    }

    // ✅ ATUALIZAÇÃO DE MENSAGEM: Não fazer scroll
    if (lastMessageChanged && !wasNewMessage) {
      console.log('[useMessagesList] 🔄 Mensagem atualizada - sem scroll');
      // Não fazer scroll para atualizações de status
    }

  }, [messages, isLoadingMore]);

  // ✅ DETECTAR SCROLL MANUAL: Desabilitar auto-scroll temporariamente
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const nearBottom = isNearBottom();
      shouldAutoScroll.current = nearBottom;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // ✅ MEMOIZAR LISTA: Sem reordenação desnecessária
  const messagesList = useMemo(() => {
    console.log('[useMessagesList] 📋 Processando mensagens:', {
      total: messages.length,
      primeira: messages[0]?.id?.substring(0, 8),
      ultima: messages[messages.length - 1]?.id?.substring(0, 8)
    });

    return messages; // Usar diretamente
  }, [messages]);

  return {
    messagesList,
    messagesEndRef,
    containerRef
  };
};
