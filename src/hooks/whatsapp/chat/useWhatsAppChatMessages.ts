
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useMessagesRealtime } from '../realtime/useMessagesRealtime';
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
  const MESSAGES_PER_PAGE = 30;
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 2;
  
  // ✅ REFS PARA CONTROLE
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastContactIdRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const isLoadingRef = useRef(false);

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

  // ✅ FUNÇÃO DE BUSCA OTIMIZADA
  const fetchMessages = useCallback(async (contactId: string, instanceId: string, offset = 0) => {
    // Cancelar requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo controller
    abortControllerRef.current = new AbortController();
    const controller = abortControllerRef.current;

    try {
      console.log('[Chat Messages] 📥 Buscando mensagens:', { 
        contactId, 
        instanceId, 
        offset,
        limit: MESSAGES_PER_PAGE
      });

      // Timeout controlado
      const timeoutId = setTimeout(() => {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      }, 10000); // 10 segundos

      const { data, error } = await supabase
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

      clearTimeout(timeoutId);

      if (error) {
        console.error('[Chat Messages] ❌ Erro ao buscar mensagens:', error);
        throw error;
      }

      const convertedMessages = (data || []).map(convertMessage);
      
      console.log('[Chat Messages] ✅ Mensagens encontradas:', convertedMessages.length);

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

  // ✅ CARREGAR MENSAGENS INICIAIS
  const loadInitialMessages = useCallback(async () => {
    if (!selectedContact || !activeInstance) {
      setMessages([]);
      setHasMoreMessages(true);
      return;
    }

    // Evitar múltiplas chamadas
    if (isLoadingRef.current) {
      console.log('[Chat Messages] ⏳ Já carregando, ignorando...');
      return;
    }

    isLoadingRef.current = true;
    setIsLoadingMessages(true);
    setError(null);

    try {
      const result = await fetchMessages(selectedContact.id, activeInstance.id);
      
      const sortedMessages = result.messages.reverse();
      
      setMessages(sortedMessages);
      setHasMoreMessages(result.hasMore);
      retryCountRef.current = 0;
      
    } catch (error: any) {
      // ✅ CORREÇÃO: Verificar se error é string ou objeto
      const errorMessage = typeof error === 'string' ? error : (error?.message || 'Erro desconhecido');
      
      if (errorMessage === 'Request cancelled') {
        console.log('[Chat Messages] ⏹️ Cancelado, não fazendo retry');
        return;
      }

      console.error('[Chat Messages] ❌ Erro ao carregar mensagens:', error);
      
      // Retry controlado
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        const delay = 1000 * retryCountRef.current;
        
        console.log(`[Chat Messages] 🔄 Tentativa ${retryCountRef.current}/${MAX_RETRIES}`);
        
        setTimeout(() => {
          if (selectedContact && selectedContact.id === lastContactIdRef.current) {
            isLoadingRef.current = false;
            loadInitialMessages();
          }
        }, delay);
        return;
      }
      
      setError('Erro ao carregar mensagens');
      setMessages([]);
      toast.error('Falha ao carregar mensagens');
    } finally {
      if (retryCountRef.current >= MAX_RETRIES || error?.message === 'Request cancelled') {
        setIsLoadingMessages(false);
        isLoadingRef.current = false;
      }
    }
  }, [selectedContact?.id, activeInstance?.id, fetchMessages]);

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
      // ✅ CORREÇÃO: Verificar se error é string ou objeto
      const errorMessage = typeof error === 'string' ? error : (error?.message || 'Erro desconhecido');
      
      if (errorMessage !== 'Request cancelled') {
        console.error('[Chat Messages] ❌ Erro ao carregar mais mensagens:', error);
        toast.error('Erro ao carregar mais mensagens');
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedContact, activeInstance, messages.length, hasMoreMessages, isLoadingMore, fetchMessages]);

  // ✅ ENVIAR MENSAGEM
  const sendMessage = useCallback(async (messageText: string, media?: { file: File; type: string }) => {
    if (!selectedContact || !activeInstance) {
      toast.error('Contato ou instância não selecionada');
      return false;
    }

    if (!messageText.trim() && !media) {
      toast.error('Mensagem não pode estar vazia');
      return false;
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
        console.log('[Chat Messages] ✅ Mensagem enviada');
        toast.success('Mensagem enviada!');
        
        if (onContactUpdate) {
          onContactUpdate(selectedContact.id, messageText, new Date().toISOString());
        }
        
        return true;
      } else {
        throw new Error(data?.error || 'Falha ao enviar mensagem');
      }

    } catch (error: any) {
      console.error('[Chat Messages] ❌ Erro ao enviar:', error);
      // ✅ CORREÇÃO: Acessar a propriedade 'message' somente se 'error' for um objeto
      const errorMessage = typeof error === 'string' ? error : (error?.message || 'Erro desconhecido');
      toast.error(`Erro ao enviar mensagem: ${errorMessage}`);
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedContact, activeInstance, onContactUpdate]);

  // ✅ CALLBACKS PARA REALTIME
  const handleNewMessage = useCallback((newMessage: Message) => {
    console.log('[Chat Messages] 📨 Nova mensagem via realtime:', newMessage.id);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (exists) {
          console.log('[Chat Messages] ⚠️ Mensagem duplicada, ignorando');
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
    }, 50);
  }, [onContactUpdate, selectedContact?.id]);

  const handleMessageUpdate = useCallback((updatedMessage: Message) => {
    console.log('[Chat Messages] 🔄 Mensagem atualizada:', updatedMessage.id);
    
    setMessages(prev => 
      prev.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      )
    );
  }, []);

  // ✅ CONFIGURAR REALTIME
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
      console.log('[Chat Messages] 👤 Contato mudou:', { 
        from: lastContactIdRef.current, 
        to: currentContactId 
      });
      
      lastContactIdRef.current = currentContactId;
      retryCountRef.current = 0;
      isLoadingRef.current = false;
      
      if (currentContactId) {
        loadInitialMessages();
      }
    }
  }, [selectedContact?.id, loadInitialMessages]);

  // ✅ SCROLL PARA BAIXO
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  // ✅ CLEANUP
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      isLoadingRef.current = false;
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
