
import { useState, useCallback, useRef, useEffect } from 'react';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { supabase } from '@/integrations/supabase/client';
import { MessageService } from '@/services/whatsapp/messageService';
import { useMessageRealtime } from './hooks/useMessageRealtime';

// Cache global otimizado com timestamps
const messagesCache = new Map<string, { data: Message[]; timestamp: number; hasMore: boolean; }>();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutos
const INITIAL_LOAD_LIMIT = 30; // Carregar 30 mensagens mais recentes
const PAGE_SIZE = 20; // Carregar 20 mensagens por vez ao fazer scroll para cima

export const useWhatsAppChatMessages = (
  selectedContact: Contact | null,
  activeInstance: WhatsAppWebInstance | null
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Refs para controle de estado e evitar loops
  const isLoadingRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const selectedContactRef = useRef(selectedContact);
  const activeInstanceRef = useRef(activeInstance);
  
  selectedContactRef.current = selectedContact;
  activeInstanceRef.current = activeInstance;

  // Verificar cache válido
  const getCachedMessages = useCallback((key: string): { data: Message[]; hasMore: boolean; } | null => {
    const cached = messagesCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return { data: cached.data, hasMore: cached.hasMore };
    }
    messagesCache.delete(key);
    return null;
  }, []);

  // Salvar no cache
  const setCachedMessages = useCallback((key: string, data: Message[], hasMore: boolean) => {
    messagesCache.set(key, { data, timestamp: Date.now(), hasMore });
  }, []);

  // Conversão otimizada de mensagem do banco para interface
  const convertMessage = useCallback((msg: any): Message => {
    let status: "sent" | "delivered" | "read" = "sent";
    if (msg.status === 'delivered') status = "delivered";
    else if (msg.status === 'read') status = "read";
    else if (msg.status === 'received') status = "delivered";

    const mediaType = msg.media_type || 'text';
    const isMediaMessage = ['image', 'video', 'audio', 'document'].includes(mediaType);

    return {
      id: msg.id,
      text: msg.text || '',
      sender: msg.from_me ? 'user' : 'contact',
      time: new Date(msg.timestamp).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      status,
      isIncoming: !msg.from_me,
      fromMe: msg.from_me || false,
      timestamp: new Date(msg.timestamp).toISOString(),
      mediaType: mediaType as any,
      mediaUrl: isMediaMessage ? msg.media_url : undefined
    };
  }, []);

  // FETCH CORRIGIDO - Mensagens mais recentes primeiro
  const fetchMessagesStable = useCallback(async (forceRefresh = false, loadMore = false): Promise<void> => {
    const currentContact = selectedContactRef.current;
    const currentInstance = activeInstanceRef.current;
    const now = Date.now();
    
    // Proteções rigorosas
    if (!currentContact || !currentInstance || isLoadingRef.current) {
      return;
    }

    // Cache key e verificação de cache
    const cacheKey = `${currentContact.id}-${currentInstance.id}`;
    
    // Verificar cache primeiro (se não forçar refresh e não for load more)
    if (!forceRefresh && !loadMore) {
      const cachedData = getCachedMessages(cacheKey);
      if (cachedData) {
        setMessages(cachedData.data);
        setHasMoreMessages(cachedData.hasMore);
        setIsLoadingMessages(false);
        return;
      }
    }

    // Throttling rigoroso para evitar spam
    if (now - lastFetchTimeRef.current < 1000 && !loadMore) {
      return;
    }

    // Debouncing apenas para fetch inicial
    if (!loadMore && debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const executeQuery = async () => {
      try {
        isLoadingRef.current = true;
        
        if (loadMore) {
          setIsLoadingMore(true);
        } else {
          setIsLoadingMessages(true);
        }
        
        lastFetchTimeRef.current = now;

        // CORRIGIDO: Lógica de paginação para mensagens mais recentes primeiro
        const limit = loadMore ? PAGE_SIZE : INITIAL_LOAD_LIMIT;
        let query = supabase
          .from('messages')
          .select('*')
          .eq('lead_id', currentContact.id)
          .eq('whatsapp_number_id', currentInstance.id)
          .order('timestamp', { ascending: false }); // Mais recentes primeiro

        if (loadMore && messages.length > 0) {
          // Para carregar mensagens mais antigas, usar timestamp da mensagem mais antiga
          const oldestMessage = messages[0]; // Primeira mensagem é a mais antiga exibida
          query = query.lt('timestamp', oldestMessage.timestamp);
        }

        const { data: messagesData, error } = await query.limit(limit);

        if (error) {
          console.error('[WhatsApp Messages] Query error:', error);
          return;
        }

        const newMessages: Message[] = (messagesData || []).map(convertMessage);

        // Determinar se há mais mensagens
        const hasMore = (messagesData?.length || 0) === limit;

        if (loadMore) {
          // Adicionar mensagens mais antigas ao início da lista
          const updatedMessages = [...newMessages, ...messages];
          setMessages(updatedMessages);
          setCachedMessages(cacheKey, updatedMessages, hasMore);
        } else {
          // Substituir todas as mensagens (carregar inicial ou refresh)
          setMessages(newMessages);
          setCachedMessages(cacheKey, newMessages, hasMore);
        }
        
        setHasMoreMessages(hasMore);
        
      } catch (error) {
        console.error('[WhatsApp Messages] Fetch error:', error);
      } finally {
        isLoadingRef.current = false;
        setIsLoadingMessages(false);
        setIsLoadingMore(false);
      }
    };

    if (loadMore) {
      // Execute imediatamente para load more
      await executeQuery();
    } else {
      // Debounce apenas para fetch inicial
      debounceTimeoutRef.current = setTimeout(executeQuery, 300);
    }
  }, [getCachedMessages, setCachedMessages, convertMessage, messages]);

  // Load more messages (mensagens mais antigas)
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMore || isLoadingMessages) return;
    await fetchMessagesStable(false, true);
  }, [hasMoreMessages, isLoadingMore, isLoadingMessages, fetchMessagesStable]);

  // Effect para mudança de contato
  useEffect(() => {
    if (selectedContact && activeInstance) {
      // Reset estado
      setHasMoreMessages(true);
      
      // Verificar cache primeiro
      const cacheKey = `${selectedContact.id}-${activeInstance.id}`;
      const cached = getCachedMessages(cacheKey);
      
      if (cached) {
        setMessages(cached.data);
        setHasMoreMessages(cached.hasMore);
        setIsLoadingMessages(false);
      } else {
        // Só fetch se não houver cache
        fetchMessagesStable(false);
      }
    } else {
      setMessages([]);
      setHasMoreMessages(true);
      setIsLoadingMessages(false);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [selectedContact?.id, activeInstance?.id, fetchMessagesStable, getCachedMessages]);

  // Send message otimizado
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!selectedContact || !activeInstance) return false;

    setIsSending(true);
    try {
      const success = await MessageService.sendMessage(selectedContact, activeInstance, text);
      if (success) {
        // Invalidar cache e refetch após delay
        const cacheKey = `${selectedContact.id}-${activeInstance.id}`;
        messagesCache.delete(cacheKey);
        
        setTimeout(() => fetchMessagesStable(true), 500);
      }
      return success;
    } catch (error) {
      console.error('[WhatsApp Messages] Send error:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [selectedContact, activeInstance, fetchMessagesStable]);

  // REALTIME REATIVADO com callback inteligente
  const handleRealtimeUpdate = useCallback(() => {
    if (selectedContactRef.current && activeInstanceRef.current) {
      console.log('[WhatsApp Messages] 🔄 Nova mensagem recebida em tempo real');
      const cacheKey = `${selectedContactRef.current.id}-${activeInstanceRef.current.id}`;
      messagesCache.delete(cacheKey);
      fetchMessagesStable(true);
    }
  }, [fetchMessagesStable]);

  // REALTIME ATIVADO
  useMessageRealtime({
    selectedContact,
    activeInstance,
    onMessageUpdate: handleRealtimeUpdate
  });

  // Cleanup geral
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    isSending,
    fetchMessages: useCallback(() => fetchMessagesStable(true), [fetchMessagesStable]),
    loadMoreMessages,
    sendMessage,
    setMessages
  };
};
