
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useMessagesRealtime } from '../realtime/useMessagesRealtime';
import { MessageSendingService } from '@/services/whatsapp/services/messageSendingService';
import { toast } from 'sonner';
import { normalizeMediaType } from './utils';

interface UseWhatsAppChatMessagesProps {
  selectedContact: Contact | null;
  activeInstance: WhatsAppWebInstance | null;
  onContactUpdate?: (contactId: string, lastMessage: string, timestamp: string) => void;
}

interface OptimisticMessage extends Message {
  isOptimistic: true;
  tempId: string;
  sendingAttempt: number;
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
  const messagesMapRef = useRef<Map<string, Message>>(new Map());
  const MESSAGES_PER_PAGE = 20;
  const abortControllerRef = useRef<AbortController | null>(null);
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
      mediaType: normalizeMediaType(messageData.media_type),
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

  // ✅ BUSCA DE MENSAGENS OTIMIZADA
  const fetchMessages = useCallback(async (contactId: string, instanceId: string, offset = 0) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const controller = abortControllerRef.current;

    try {
      console.log('[Chat Messages] 📥 Buscando mensagens otimizadas:', { 
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

      if (messagesError) throw messagesError;

      const convertedMessages = (messagesData || []).map(convertMessage);
      
      console.log('[Chat Messages] ✅ Mensagens carregadas (otimizadas):', convertedMessages.length);

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

  // ✅ SCROLL AUTOMÁTICO OTIMIZADO COM MÚLTIPLAS TENTATIVAS
  const scrollToBottom = useCallback(() => {
    if (!messagesEndRef.current) return;
    
    const scrollToEnd = (attempt = 0) => {
      if (!messagesEndRef.current) return;
      
      try {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
        
        console.log(`[Chat Messages] 📍 Scroll otimizado tentativa ${attempt + 1}`);
      } catch (error) {
        console.warn('[Chat Messages] ⚠️ Erro no scroll:', error);
      }
    };

    scrollToEnd(0);
    setTimeout(() => scrollToEnd(1), 100);
    setTimeout(() => scrollToEnd(2), 300);
    setTimeout(() => scrollToEnd(3), 500); // Tentativa adicional
  }, []);

  // ✅ CARREGAR MENSAGENS INICIAIS
  const loadInitialMessages = useCallback(async () => {
    if (!selectedContact || !activeInstance) {
      setMessages([]);
      setHasMoreMessages(true);
      messagesMapRef.current.clear();
      return;
    }

    console.log('[Chat Messages] 🚀 Carregando mensagens iniciais (otimizadas)');
    
    setIsLoadingMessages(true);
    setError(null);

    try {
      const result = await fetchMessages(selectedContact.id, activeInstance.id);
      
      const sortedMessages = result.messages.reverse();
      
      // ✅ ATUALIZAR MAP INTERNO
      messagesMapRef.current.clear();
      sortedMessages.forEach(msg => {
        messagesMapRef.current.set(msg.id, msg);
      });
      
      setMessages(sortedMessages);
      setHasMoreMessages(result.hasMore);
      
      console.log('[Chat Messages] ✅ Mensagens carregadas com sucesso (otimizadas):', sortedMessages.length);
      
      setTimeout(() => scrollToBottom(), 100);
      
    } catch (error: any) {
      if (error.message === 'Request cancelled') return;

      console.error('[Chat Messages] ❌ Erro ao carregar mensagens:', error);
      setError('Erro ao carregar mensagens');
      setMessages([]);
      toast.error('Falha ao carregar mensagens');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedContact?.id, activeInstance?.id, fetchMessages, scrollToBottom]);

  // ✅ CARREGAR MAIS MENSAGENS
  const loadMoreMessages = useCallback(async () => {
    if (!selectedContact || !activeInstance || !hasMoreMessages || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      const result = await fetchMessages(selectedContact.id, activeInstance.id, messages.length);
      
      if (result.messages.length > 0) {
        const sortedNewMessages = result.messages.reverse();
        
        // ✅ ATUALIZAR MAP INTERNO
        sortedNewMessages.forEach(msg => {
          messagesMapRef.current.set(msg.id, msg);
        });
        
        setMessages(prev => [...sortedNewMessages, ...prev]);
        setHasMoreMessages(result.hasMore);
      } else {
        setHasMoreMessages(false);
      }
      
    } catch (error: any) {
      if (error.message !== 'Request cancelled') {
        console.error('[Chat Messages] ❌ Erro ao carregar mais mensagens:', error);
        toast.error('Erro ao carregar mais mensagens');
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedContact, activeInstance, messages.length, hasMoreMessages, isLoadingMore, fetchMessages]);

  // ✅ ENVIAR MENSAGEM COM UI OTIMISTA E RETRY MELHORADO
  const sendMessage = useCallback(async (messageText: string, media?: { file: File; type: string }) => {
    if (!selectedContact || !activeInstance) {
      toast.error('Contato ou instância não selecionada');
      return false;
    }

    if (!messageText.trim() && !media) {
      toast.error('Mensagem não pode estar vazia');
      return false;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: OptimisticMessage = {
      id: tempId,
      tempId,
      text: messageText.trim(),
      fromMe: true,
      timestamp: new Date().toISOString(),
      status: 'sending',
      mediaType: normalizeMediaType(media?.type || 'text'),
      sender: 'user',
      time: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isIncoming: false,
      isOptimistic: true,
      sendingAttempt: 1
    };

    // ✅ UI OTIMISTA: Adicionar mensagem imediatamente
    setMessages(prev => [...prev, optimisticMessage]);
    setIsSendingMessage(true);
    
    setTimeout(() => scrollToBottom(), 50);

    try {
      // ✅ ENVIAR COM RETRY AUTOMÁTICO USANDO whatsapp_messaging_service
      const result = await MessageSendingService.sendMessageWithRetry(
        activeInstance.id,
        selectedContact.id,
        messageText.trim(),
        media
      );

      if (result.success) {
        console.log('[Chat Messages] ✅ Mensagem enviada com sucesso (otimizada)');
        
        // ✅ REMOVER MENSAGEM OTIMISTA (será substituída pelo realtime)
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        
        if (onContactUpdate) {
          onContactUpdate(selectedContact.id, messageText, new Date().toISOString());
        }
        
        return true;
      } else {
        // ✅ MARCAR COMO FALHA
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...msg, status: 'failed' as const } : msg
        ));
        
        throw new Error(result.error || 'Falha ao enviar mensagem');
      }

    } catch (error: any) {
      console.error('[Chat Messages] ❌ Erro ao enviar (otimizado):', error);
      
      // ✅ MARCAR COMO FALHA
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'failed' as const } : msg
      ));
      
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedContact, activeInstance, onContactUpdate, scrollToBottom]);

  // ✅ CALLBACKS PARA REALTIME OTIMIZADO
  const handleNewMessage = useCallback((newMessage: Message) => {
    console.log('[Chat Messages] 📨 Nova mensagem via realtime otimizado (INSERT):', newMessage.id);
    
    // ✅ VERIFICAR SE JÁ EXISTE (evitar duplicatas)
    if (messagesMapRef.current.has(newMessage.id)) {
      console.log('[Chat Messages] ⚠️ Mensagem duplicada ignorada:', newMessage.id);
      return;
    }
    
    // ✅ ADICIONAR AO MAP
    messagesMapRef.current.set(newMessage.id, newMessage);
    
    setMessages(prev => {
      // ✅ REMOVER MENSAGEM OTIMISTA SE EXISTIR
      const filteredMessages = prev.filter(msg => !msg.isOptimistic);
      return [...filteredMessages, newMessage];
    });
    
    // ✅ ATUALIZAR CONTATO SE MENSAGEM RECEBIDA
    if (onContactUpdate && !newMessage.fromMe) {
      onContactUpdate(
        selectedContact?.id || '',
        newMessage.text,
        newMessage.timestamp || new Date().toISOString()
      );
    }
    
    // ✅ SCROLL AUTOMÁTICO OTIMIZADO PARA NOVAS MENSAGENS
    setTimeout(() => scrollToBottom(), 100);
  }, [onContactUpdate, selectedContact?.id, scrollToBottom]);

  const handleMessageUpdate = useCallback((updatedMessage: Message) => {
    console.log('[Chat Messages] 🔄 Mensagem atualizada via realtime otimizado (UPDATE):', updatedMessage.id);
    
    // ✅ ATUALIZAR MAP
    messagesMapRef.current.set(updatedMessage.id, updatedMessage);
    
    setMessages(prev => 
      prev.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      )
    );
  }, []);

  // ✅ CONFIGURAR REALTIME OTIMIZADO
  useMessagesRealtime({
    selectedContact,
    activeInstance,
    onNewMessage: handleNewMessage,
    onMessageUpdate: handleMessageUpdate
  });

  // ✅ EFEITO PRINCIPAL
  useEffect(() => {
    const currentContactId = selectedContact?.id;
    
    if (currentContactId !== lastContactIdRef.current) {
      console.log('[Chat Messages] 👤 Contato mudou (otimizado):', { 
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
    scrollToBottom
  };
};
