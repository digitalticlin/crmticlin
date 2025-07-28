
/**
 * 🎯 HOOK PARA MENSAGENS DO WHATSAPP - OTIMIZADO FASE 1
 * 
 * OTIMIZAÇÕES FASE 1:
 * ✅ Comunicação com useChatsRealtime via callback onMoveContactToTop
 * ✅ Uso de windowEventManager para cleanup automático
 * ✅ Melhores callbacks para realtime
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useMessagesRealtime } from '../realtime/useMessagesRealtime';
import { toast } from 'sonner';

interface UseWhatsAppChatMessagesProps {
  selectedContact: Contact | null;
  activeInstance: WhatsAppWebInstance | null;
  // 🚀 FASE 1: Novo callback para comunicação com contatos
  onMoveContactToTop?: (contactId: string, messageInfo: { text: string; timestamp: string; unreadCount?: number }) => void;
}

export const useWhatsAppChatMessages = ({
  selectedContact,
  activeInstance,
  onMoveContactToTop
}: UseWhatsAppChatMessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const MESSAGES_PER_PAGE = 50;

  // ✅ CONVERSÃO DE MENSAGEM DO BANCO PARA UI
  const convertMessage = useCallback((messageData: any): Message => {
    const mediaCache = messageData.media_cache;
    
    return {
      id: messageData.id,
      text: messageData.text || '',
      fromMe: messageData.from_me || false,
      timestamp: messageData.created_at || new Date().toISOString(),
      status: messageData.status || 'sent',
      mediaType: messageData.media_type || 'text',
      mediaUrl: messageData.media_url || undefined,
      sender: messageData.from_me ? 'user' : 'contact',
      time: new Date(messageData.created_at || Date.now()).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isIncoming: !messageData.from_me,
      media_cache: mediaCache ? {
        id: mediaCache.id,
        base64_data: mediaCache.base64_data,
        original_url: mediaCache.original_url,
        cached_url: mediaCache.cached_url,
        file_size: mediaCache.file_size,
        media_type: mediaCache.media_type,
        file_name: mediaCache.file_name
      } : null
    } satisfies Message;
  }, []);

  // ✅ BUSCAR MENSAGENS DO BANCO
  const fetchMessages = useCallback(async (contactId: string, instanceId: string, offset = 0) => {
    try {
      console.log('[Chat Messages] 📥 Buscando mensagens FASE 1:', { 
        contactId, 
        instanceId, 
        offset,
        limit: MESSAGES_PER_PAGE
      });

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          media_cache (
            id,
            base64_data,
            original_url,
            cached_url,
            file_size,
            media_type,
            file_name
          )
        `)
        .eq('lead_id', contactId)
        .eq('whatsapp_number_id', instanceId)
        .order('created_at', { ascending: false })
        .range(offset, offset + MESSAGES_PER_PAGE - 1);

      if (error) {
        console.error('[Chat Messages] ❌ Erro ao buscar mensagens FASE 1:', error);
        throw error;
      }

      const convertedMessages = (data || []).map(convertMessage);
      
      console.log('[Chat Messages] ✅ Mensagens convertidas FASE 1:', {
        count: convertedMessages.length,
        hasMore: convertedMessages.length === MESSAGES_PER_PAGE
      });

      return {
        messages: convertedMessages,
        hasMore: convertedMessages.length === MESSAGES_PER_PAGE
      };

    } catch (error: any) {
      console.error('[Chat Messages] ❌ Erro na busca FASE 1:', error);
      throw error;
    }
  }, [convertMessage]);

  // ✅ CARREGAR MENSAGENS INICIAIS
  const loadInitialMessages = useCallback(async () => {
    if (!selectedContact || !activeInstance) {
      setMessages([]);
      setHasMoreMessages(true);
      return;
    }

    setIsLoadingMessages(true);
    setError(null);

    try {
      const result = await fetchMessages(selectedContact.id, activeInstance.id);
      
      // Inverter ordem para mostrar mais recentes embaixo
      const sortedMessages = result.messages.reverse();
      
      setMessages(sortedMessages);
      setHasMoreMessages(result.hasMore);
      
    } catch (error: any) {
      console.error('[Chat Messages] ❌ Erro ao carregar mensagens iniciais FASE 1:', error);
      setError(error.message || 'Erro ao carregar mensagens');
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedContact, activeInstance, fetchMessages]);

  // ✅ CARREGAR MAIS MENSAGENS (SCROLL INFINITO)
  const loadMoreMessages = useCallback(async () => {
    if (!selectedContact || !activeInstance || !hasMoreMessages || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const result = await fetchMessages(selectedContact.id, activeInstance.id, messages.length);
      
      if (result.messages.length > 0) {
        // Adicionar mensagens mais antigas no início
        const sortedNewMessages = result.messages.reverse();
        setMessages(prev => [...sortedNewMessages, ...prev]);
        setHasMoreMessages(result.hasMore);
      } else {
        setHasMoreMessages(false);
      }
      
    } catch (error: any) {
      console.error('[Chat Messages] ❌ Erro ao carregar mais mensagens FASE 1:', error);
      toast.error('Erro ao carregar mais mensagens');
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedContact, activeInstance, messages.length, hasMoreMessages, isLoadingMore, fetchMessages]);

  // ✅ ENVIAR MENSAGEM
  const sendMessage = useCallback(async (messageText: string, media?: { file: File; type: string }) => {
    if (!selectedContact || !activeInstance) {
      toast.error('Contato ou instância não selecionada');
      return;
    }

    if (!messageText.trim() && !media) {
      toast.error('Mensagem não pode estar vazia');
      return;
    }

    setIsSendingMessage(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send_whatsapp_message', {
        body: {
          instanceId: activeInstance.id,
          contactId: selectedContact.id,
          message: messageText.trim(),
          media: media ? {
            file: media.file,
            type: media.type
          } : undefined
        }
      });

      if (error) throw error;

      if (data?.success) {
        console.log('[Chat Messages] ✅ Mensagem enviada com sucesso FASE 1');
        toast.success('Mensagem enviada!');
        
        // A mensagem será adicionada automaticamente via realtime
        return true;
      } else {
        throw new Error(data?.error || 'Falha ao enviar mensagem');
      }

    } catch (error: any) {
      console.error('[Chat Messages] ❌ Erro ao enviar mensagem FASE 1:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedContact, activeInstance]);

  // ✅ CALLBACKS PARA REALTIME
  const handleNewMessage = useCallback((newMessage: Message) => {
    console.log('[Chat Messages] 📨 Nova mensagem recebida via realtime FASE 1:', newMessage);
    
    setMessages(prev => {
      // Verificar se a mensagem já existe
      const exists = prev.some(msg => msg.id === newMessage.id);
      if (exists) {
        console.log('[Chat Messages] ⚠️ Mensagem já existe, ignorando FASE 1');
        return prev;
      }
      
      // Adicionar nova mensagem no final
      return [...prev, newMessage];
    });
  }, []);

  const handleMessageUpdate = useCallback((updatedMessage: Message) => {
    console.log('[Chat Messages] 🔄 Mensagem atualizada via realtime FASE 1:', updatedMessage);
    
    setMessages(prev => 
      prev.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      )
    );
  }, []);

  // 🚀 CONFIGURAR REALTIME OTIMIZADO FASE 1
  useMessagesRealtime({
    selectedContact,
    activeInstance,
    onNewMessage: handleNewMessage,
    onMessageUpdate: handleMessageUpdate,
    onMoveContactToTop // 🚀 FASE 1: Passar callback para comunicação com contatos
  });

  // ✅ CARREGAR MENSAGENS QUANDO CONTATO MUDAR
  useEffect(() => {
    loadInitialMessages();
  }, [loadInitialMessages]);

  // ✅ SCROLL PARA BAIXO EM NOVAS MENSAGENS
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  return {
    messages,
    isLoadingMessages,
    isSendingMessage,
    error,
    hasMoreMessages,
    isLoadingMore,
    messagesEndRef,
    sendMessage,
    loadMoreMessages,
    refreshMessages: loadInitialMessages,
    scrollToBottom
  };
};
