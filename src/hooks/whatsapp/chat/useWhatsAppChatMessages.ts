
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useMessagesRealtime } from '../realtime/useMessagesRealtime';
import { MessageSendingService } from '@/services/whatsapp/services/messageSendingService';
import { toast } from 'sonner';

interface UseWhatsAppChatMessagesProps {
  selectedContact: Contact | null;
  activeInstance: WhatsAppWebInstance | null;
  onContactUpdate?: (contactId: string, lastMessage: string, timestamp: string) => void;
}

export const useWhatsAppChatMessages = ({
  selectedContact,
  activeInstance,
  onContactUpdate
}: UseWhatsAppChatMessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const MESSAGES_PER_PAGE = 20;
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContactIdRef = useRef<string | null>(null);
  
  // ✅ CONVERSÃO OTIMIZADA DE MENSAGEM
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

  // ✅ TIMEOUT PARA EVITAR LOADING INFINITO
  const setLoadingWithTimeout = useCallback((loading: boolean) => {
    setIsLoadingMessages(loading);
    
    if (loading) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('[Chat Messages] ⏰ Timeout: Forçando fim do loading');
        setIsLoadingMessages(false);
        setError('Timeout ao carregar mensagens');
        toast.error('Timeout ao carregar mensagens');
      }, 15000);
    } else {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  }, []);

  // ✅ FUNÇÃO DE BUSCA OTIMIZADA
  const fetchMessages = useCallback(async (contactId: string, instanceId: string, offset = 0) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const controller = abortControllerRef.current;

    try {
      console.log('[Chat Messages] 📥 Buscando mensagens:', { 
        contactId: contactId.substring(0, 8), 
        instanceId: instanceId.substring(0, 8), 
        offset,
        limit: MESSAGES_PER_PAGE
      });

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          text,
          from_me,
          created_at,
          status,
          media_type,
          media_url,
          lead_id,
          whatsapp_number_id,
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
        .range(offset, offset + MESSAGES_PER_PAGE - 1)
        .abortSignal(controller.signal);

      if (messagesError) {
        console.error('[Chat Messages] ❌ Erro ao buscar mensagens:', messagesError);
        throw messagesError;
      }

      const convertedMessages = (messagesData || []).map(convertMessage);
      
      console.log('[Chat Messages] ✅ Mensagens carregadas:', {
        total: convertedMessages.length,
        offset,
        hasMore: convertedMessages.length === MESSAGES_PER_PAGE
      });

      return {
        messages: convertedMessages,
        hasMore: convertedMessages.length === MESSAGES_PER_PAGE
      };

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[Chat Messages] ⏹️ Requisição cancelada');
        throw new Error('Request cancelled');
      }
      
      console.error('[Chat Messages] ❌ Erro na busca:', error);
      throw error;
    }
  }, [convertMessage]);

  // ✅ SCROLL AUTOMÁTICO ROBUSTO COM MÚLTIPLAS TENTATIVAS
  const scrollToBottom = useCallback(() => {
    if (!messagesEndRef.current) return;
    
    const attempts = [0, 100, 300];
    
    attempts.forEach((delay, index) => {
      setTimeout(() => {
        if (messagesEndRef.current) {
          try {
            messagesEndRef.current.scrollIntoView({ 
              behavior: 'instant',
              block: 'end',
              inline: 'nearest'
            });
            console.log(`[Chat Messages] 📍 Scroll tentativa ${index + 1} executada`);
          } catch (error) {
            console.warn('[Chat Messages] ⚠️ Erro no scroll:', error);
          }
        }
      }, delay);
    });
  }, []);

  // ✅ CARREGAR MENSAGENS INICIAIS
  const loadInitialMessages = useCallback(async () => {
    if (!selectedContact || !activeInstance) {
      setMessages([]);
      setHasMoreMessages(true);
      return;
    }

    console.log('[Chat Messages] 🚀 Carregando mensagens iniciais');
    
    setLoadingWithTimeout(true);
    setError(null);

    try {
      const result = await fetchMessages(selectedContact.id, activeInstance.id);
      
      const sortedMessages = result.messages.reverse();
      
      setMessages(sortedMessages);
      setHasMoreMessages(result.hasMore);
      
      console.log('[Chat Messages] ✅ Mensagens carregadas:', {
        total: sortedMessages.length,
        hasMore: result.hasMore
      });
      
      // ✅ SCROLL AUTOMÁTICO COM DELAY
      setTimeout(() => scrollToBottom(), 100);
      
    } catch (error: any) {
      const errorMessage = typeof error === 'string' ? error : (error?.message || 'Erro desconhecido');
      
      if (errorMessage === 'Request cancelled') {
        console.log('[Chat Messages] ⏹️ Cancelado');
        return;
      }

      console.error('[Chat Messages] ❌ Erro ao carregar mensagens:', error);
      setError('Erro ao carregar mensagens');
      setMessages([]);
      toast.error('Falha ao carregar mensagens');
    } finally {
      setLoadingWithTimeout(false);
    }
  }, [selectedContact?.id, activeInstance?.id, fetchMessages, scrollToBottom, setLoadingWithTimeout]);

  // ✅ CARREGAR MAIS MENSAGENS
  const loadMoreMessages = useCallback(async () => {
    if (!selectedContact || !activeInstance || !hasMoreMessages || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const result = await fetchMessages(selectedContact.id, activeInstance.id, messages.length);
      
      if (result.messages.length > 0) {
        const sortedNewMessages = result.messages.reverse();
        setMessages(prev => [...sortedNewMessages, ...prev]);
        setHasMoreMessages(result.hasMore);
      } else {
        setHasMoreMessages(false);
      }
      
    } catch (error: any) {
      const errorMessage = typeof error === 'string' ? error : (error?.message || 'Erro desconhecido');
      
      if (errorMessage !== 'Request cancelled') {
        console.error('[Chat Messages] ❌ Erro ao carregar mais mensagens:', error);
        toast.error('Erro ao carregar mais mensagens');
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedContact, activeInstance, messages.length, hasMoreMessages, isLoadingMore, fetchMessages]);

  // ✅ ENVIAR MENSAGEM COM SERVIÇO CORRIGIDO
  const sendMessage = useCallback(async (messageText: string, mediaType?: string, mediaUrl?: string) => {
    if (!selectedContact || !activeInstance) {
      toast.error('Contato ou instância não selecionada');
      return false;
    }

    if (!messageText.trim()) {
      toast.error('Mensagem não pode estar vazia');
      return false;
    }

    console.log('[Chat Messages] 📤 Enviando mensagem:', {
      contactId: selectedContact.id.substring(0, 8),
      instanceId: activeInstance.id.substring(0, 8),
      messageLength: messageText.length,
      mediaType: mediaType || 'text'
    });

    setIsSendingMessage(true);
    
    try {
      const result = await MessageSendingService.sendMessage(
        activeInstance.id,
        selectedContact.phone,
        messageText.trim(),
        mediaType,
        mediaUrl
      );

      if (result.success) {
        console.log('[Chat Messages] ✅ Mensagem enviada via MessageSendingService');
        toast.success('Mensagem enviada!');
        
        if (onContactUpdate) {
          onContactUpdate(selectedContact.id, messageText, new Date().toISOString());
        }
        
        return true;
      } else {
        throw new Error(result.error || 'Falha ao enviar mensagem');
      }

    } catch (error: any) {
      console.error('[Chat Messages] ❌ Erro ao enviar:', error);
      const errorMessage = typeof error === 'string' ? error : (error?.message || 'Erro desconhecido');
      toast.error(`Erro ao enviar mensagem: ${errorMessage}`);
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedContact, activeInstance, onContactUpdate]);

  // ✅ CALLBACKS OTIMIZADOS PARA REALTIME
  const handleNewMessage = useCallback((newMessage: Message) => {
    console.log('[Chat Messages] 📨 Nova mensagem via realtime:', {
      id: newMessage.id,
      fromMe: newMessage.fromMe,
      text: newMessage.text.substring(0, 30) + '...'
    });
    
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === newMessage.id);
      if (exists) {
        console.log('[Chat Messages] ⚠️ Mensagem duplicada ignorada:', newMessage.id);
        return prev;
      }
      
      if (onContactUpdate && !newMessage.fromMe) {
        onContactUpdate(
          selectedContact?.id || '',
          newMessage.text,
          newMessage.timestamp || new Date().toISOString()
        );
      }
      
      return [...prev, newMessage];
    });
    
    // ✅ SCROLL AUTOMÁTICO PARA NOVAS MENSAGENS
    setTimeout(() => scrollToBottom(), 50);
  }, [onContactUpdate, selectedContact?.id, scrollToBottom]);

  const handleMessageUpdate = useCallback((updatedMessage: Message) => {
    console.log('[Chat Messages] 🔄 Mensagem atualizada:', updatedMessage.id);
    
    setMessages(prev => 
      prev.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      )
    );
  }, []);

  // ✅ CONFIGURAR REALTIME COM LOGS
  const { isConnected, connectionAttempts, maxAttempts } = useMessagesRealtime({
    selectedContact,
    activeInstance,
    onNewMessage: handleNewMessage,
    onMessageUpdate: handleMessageUpdate
  });

  // ✅ EFEITO PRINCIPAL - CARREGAR MENSAGENS
  useEffect(() => {
    const currentContactId = selectedContact?.id;
    
    if (currentContactId !== lastContactIdRef.current) {
      console.log('[Chat Messages] 👤 Contato mudou:', { 
        from: lastContactIdRef.current?.substring(0, 8), 
        to: currentContactId?.substring(0, 8) 
      });
      
      lastContactIdRef.current = currentContactId;
      
      if (currentContactId) {
        loadInitialMessages();
      }
    }
  }, [selectedContact?.id, loadInitialMessages]);

  // ✅ CLEANUP
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

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
    scrollToBottom,
    // ✅ ESTATÍSTICAS DO REALTIME
    realtimeStats: {
      isConnected,
      connectionAttempts,
      maxAttempts
    }
  };
};
