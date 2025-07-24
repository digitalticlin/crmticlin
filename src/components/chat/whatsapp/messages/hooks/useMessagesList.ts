
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

    // ✅ CORREÇÃO CRÍTICA: Para carregamento inicial, scroll IMEDIATO e múltiplo para garantir
    if (wasInitialLoad && messagesEndRef.current) {
      console.log('[useMessagesList] 🚀 Carregamento inicial - scroll INSTANTÂNEO para última mensagem');
      
      // Scroll imediato
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'instant',
        block: 'end',
        inline: 'nearest'
      });
      
      // Backup com delay pequeno para garantir que DOM está pronto
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'instant',
            block: 'end',
            inline: 'nearest'
          });
          console.log('[useMessagesList] ✅ Scroll inicial garantido com backup');
        }
      }, 100);
      
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

  // Memoizar lista de mensagens (ORDEM JÁ CORRETA do hook principal)
  const messagesList = useMemo(() => {
    // ✅ OTIMIZAÇÃO: Não reordenar, mensagens já vêm na ordem correta do useWhatsAppChatMessages
    // O hook principal já faz: busca desc + inversão para exibição (antigas no topo, recentes no final)
    console.log('[useMessagesList] 📋 Processando mensagens:', {
      total: messages.length,
      primeira: messages[0]?.id?.substring(0, 8),
      ultima: messages[messages.length - 1]?.id?.substring(0, 8)
    });

    return messages; // Usar diretamente sem re-ordenação
  }, [messages]);

  return {
    messagesList,
    messagesEndRef
  };
};
