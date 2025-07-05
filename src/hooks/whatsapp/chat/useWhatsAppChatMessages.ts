import { useState, useCallback, useRef, useEffect } from 'react';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { supabase } from '@/integrations/supabase/client';
import { MessageService } from '@/services/whatsapp/messageService';
import { useMessageRealtime } from './hooks/useMessageRealtime';

// Cache global otimizado com timestamps
const messagesCache = new Map<string, { data: Message[]; timestamp: number; hasMore: boolean; }>();
const CACHE_DURATION = 30 * 1000; // 30 segundos - reduzido para melhor responsividade
const INITIAL_LOAD_LIMIT = 30;
const PAGE_SIZE = 20;

export const useWhatsAppChatMessages = (
  selectedContact: Contact | null,
  activeInstance: WhatsAppWebInstance | null
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Refs para controle rigoroso e evitar loops
  const isLoadingRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const selectedContactRef = useRef(selectedContact);
  const activeInstanceRef = useRef(activeInstance);
  const currentCacheKeyRef = useRef<string>('');
  
  // Atualizar refs sem causar re-renders
  selectedContactRef.current = selectedContact;
  activeInstanceRef.current = activeInstance;

  // Cache helpers otimizados
  const getCachedMessages = useCallback((key: string) => {
    const cached = messagesCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return { data: cached.data, hasMore: cached.hasMore };
    }
    messagesCache.delete(key);
    return null;
  }, []);

  const setCachedMessages = useCallback((key: string, data: Message[], hasMore: boolean) => {
    messagesCache.set(key, { data, timestamp: Date.now(), hasMore });
  }, []);

  // Conversão otimizada
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

  // FETCH CORRIGIDO - Sem dependências circulares
  const fetchMessagesStable = useCallback(async (forceRefresh = false, loadMore = false): Promise<void> => {
    const currentContact = selectedContactRef.current;
    const currentInstance = activeInstanceRef.current;
    const now = Date.now();
    
    // Proteções rigorosas
    if (!currentContact || !currentInstance || isLoadingRef.current) {
      return;
    }

    const cacheKey = `${currentContact.id}-${currentInstance.id}`;
    
    // Verificar cache primeiro
    if (!forceRefresh && !loadMore) {
      const cachedData = getCachedMessages(cacheKey);
      if (cachedData) {
        setMessages(cachedData.data);
        setHasMoreMessages(cachedData.hasMore);
        setIsLoadingMessages(false);
        return;
      }
    }

    // Throttling otimizado para melhor responsividade
    if (now - lastFetchTimeRef.current < 500 && !loadMore) {
      console.log('[WhatsApp Messages] ⚠️ Throttling: muito rápido, ignorando');
      return;
    }

    // Debouncing otimizado
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

        const limit = loadMore ? PAGE_SIZE : INITIAL_LOAD_LIMIT;
        let query = supabase
          .from('messages')
          .select('*')
          .eq('lead_id', currentContact.id)
          .eq('whatsapp_number_id', currentInstance.id)
          .order('timestamp', { ascending: false });

        // Paginação corrigida
        if (loadMore && messages.length > 0) {
          const oldestMessage = messages[0];
          query = query.lt('timestamp', oldestMessage.timestamp);
        }

        const { data: messagesData, error } = await query.limit(limit);

        if (error) {
          console.error('[WhatsApp Messages] Query error:', error);
          return;
        }

        const newMessages: Message[] = (messagesData || []).map(convertMessage);
        const hasMore = (messagesData?.length || 0) === limit;

        if (loadMore) {
          // CORRIGIDO: Evitar mutação do estado durante o setState
          setMessages(prevMessages => [...newMessages, ...prevMessages]);
        } else {
          setMessages(newMessages);
        }
        
        setHasMoreMessages(hasMore);
        setCachedMessages(cacheKey, loadMore ? [...newMessages, ...messages] : newMessages, hasMore);
        
      } catch (error) {
        console.error('[WhatsApp Messages] Fetch error:', error);
      } finally {
        isLoadingRef.current = false;
        setIsLoadingMessages(false);
        setIsLoadingMore(false);
      }
    };

    if (loadMore) {
      await executeQuery();
    } else {
      debounceTimeoutRef.current = setTimeout(executeQuery, 500);
    }
  }, [getCachedMessages, setCachedMessages, convertMessage]); // REMOVIDO 'messages' das dependências

  // Load more sem dependências problemáticas
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMore || isLoadingMessages) return;
    await fetchMessagesStable(false, true);
  }, [hasMoreMessages, isLoadingMore, isLoadingMessages, fetchMessagesStable]);

  // Effect para mudança de contato - OTIMIZADO
  useEffect(() => {
    const newCacheKey = selectedContact && activeInstance 
      ? `${selectedContact.id}-${activeInstance.id}` 
      : '';
      
    // Só fetch se mudou de contato
    if (newCacheKey !== currentCacheKeyRef.current) {
      currentCacheKeyRef.current = newCacheKey;
      
      if (selectedContact && activeInstance) {
        setHasMoreMessages(true);
        
        const cached = getCachedMessages(newCacheKey);
        if (cached) {
          setMessages(cached.data);
          setHasMoreMessages(cached.hasMore);
          setIsLoadingMessages(false);
        } else {
          fetchMessagesStable(false);
        }
      } else {
        setMessages([]);
        setHasMoreMessages(true);
        setIsLoadingMessages(false);
      }
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [selectedContact?.id, activeInstance?.id, fetchMessagesStable, getCachedMessages]);

  // Send message otimizado
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    const currentContact = selectedContactRef.current;
    const currentInstance = activeInstanceRef.current;
    
    if (!currentContact || !currentInstance) return false;

    setIsSending(true);
    try {
      const success = await MessageService.sendMessage(currentContact, currentInstance, text);
      if (success) {
        const cacheKey = `${currentContact.id}-${currentInstance.id}`;
        messagesCache.delete(cacheKey);
        
        // Delay menor para melhor UX
        setTimeout(() => fetchMessagesStable(true), 300);
      }
      return success;
    } catch (error) {
      console.error('[WhatsApp Messages] Send error:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [fetchMessagesStable]);

  // Callback do realtime ESTABILIZADO com updates otimistas
  const handleRealtimeUpdate = useCallback((newMessage?: any) => {
    const currentContact = selectedContactRef.current;
    const currentInstance = activeInstanceRef.current;
    
    if (currentContact && currentInstance) {
      console.log('[WhatsApp Messages] 🔄 Realtime update triggered');
      
      // Update otimista: adicionar mensagem imediatamente se fornecida
      if (newMessage && newMessage.lead_id === currentContact.id) {
        const optimisticMessage: Message = {
          id: newMessage.id,
          text: newMessage.text || '',
          sender: newMessage.from_me ? 'user' : 'contact',
          time: new Date(newMessage.timestamp).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          status: newMessage.status || 'sent',
          isIncoming: !newMessage.from_me,
          fromMe: newMessage.from_me || false,
          timestamp: new Date(newMessage.timestamp).toISOString(),
          mediaType: newMessage.media_type || 'text',
          mediaUrl: newMessage.media_url
        };
        
        // Adicionar mensagem imediatamente para melhor UX
        setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      }
      
      const cacheKey = `${currentContact.id}-${currentInstance.id}`;
      messagesCache.delete(cacheKey);
      
      // Debounce para evitar múltiplas chamadas
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        fetchMessagesStable(true);
      }, 300); // Reduzido para 300ms
    }
  }, [fetchMessagesStable]);

  // Realtime ativado
  useMessageRealtime({
    selectedContact,
    activeInstance,
    onMessageUpdate: handleRealtimeUpdate
  });

  // Cleanup final
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
