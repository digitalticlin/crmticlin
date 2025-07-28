
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
  const MAX_RETRIES = 3;
  
  // ✅ REFS PARA EVITAR LOOP INFINITO
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitializedRef = useRef(false);
  const lastContactIdRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // ✅ CONVERSÃO OTIMIZADA DE MENSAGEM - ESTÁVEL
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

  // ✅ FUNÇÃO DE BUSCA OTIMIZADA COM TIMEOUT CONTROLADO
  const fetchMessages = useCallback(async (contactId: string, instanceId: string, offset = 0) => {
    // Cancelar requisição anterior se existir
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

      // ✅ TIMEOUT MAIS LONGO E CONTROLADO
      const timeoutId = setTimeout(() => {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      }, 15000); // 15 segundos

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
      
      console.log('[Chat Messages] ✅ Mensagens convertidas:', {
        count: convertedMessages.length,
        hasMore: convertedMessages.length === MESSAGES_PER_PAGE
      });

      return {
        messages: convertedMessages,
        hasMore: convertedMessages.length === MESSAGES_PER_PAGE
      };

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[Chat Messages] ⏹️ Requisição cancelada (normal)');
        throw new Error('Request cancelled');
      }
      
      console.error('[Chat Messages] ❌ Erro na busca:', error);
      throw error;
    }
  }, [convertMessage]);

  // ✅ CARREGAR MENSAGENS COM RETRY CONTROLADO
  const loadInitialMessages = useCallback(async () => {
    if (!selectedContact || !activeInstance) {
      setMessages([]);
      setHasMoreMessages(true);
      return;
    }

    // ✅ EVITAR MÚLTIPLAS CHAMADAS SIMULTÂNEAS
    if (isLoadingMessages) {
      console.log('[Chat Messages] ⏳ Já carregando mensagens, ignorando...');
      return;
    }

    setIsLoadingMessages(true);
    setError(null);

    try {
      const result = await fetchMessages(selectedContact.id, activeInstance.id);
      
      const sortedMessages = result.messages.reverse();
      
      setMessages(sortedMessages);
      setHasMoreMessages(result.hasMore);
      retryCountRef.current = 0; // Reset retry count on success
      
    } catch (error: any) {
      if (error.message === 'Request cancelled') {
        console.log('[Chat Messages] ⏹️ Requisição cancelada, não fazendo retry');
        return;
      }

      console.error('[Chat Messages] ❌ Erro ao carregar mensagens iniciais:', error);
      
      // ✅ RETRY CONTROLADO - EVITAR LOOP
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 5000);
        
        console.log(`[Chat Messages] 🔄 Tentativa ${retryCountRef.current}/${MAX_RETRIES} em ${delay}ms`);
        
        setTimeout(() => {
          // ✅ VERIFICAR SE AINDA É O MESMO CONTATO
          if (selectedContact && selectedContact.id === lastContactIdRef.current) {
            loadInitialMessages();
          }
        }, delay);
        return;
      }
      
      setError(error.message || 'Erro ao carregar mensagens');
      setMessages([]);
      toast.error('Falha ao carregar mensagens. Verifique sua conexão.');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedContact?.id, activeInstance?.id, fetchMessages, isLoadingMessages]);

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
      if (error.message !== 'Request cancelled') {
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
        console.log('[Chat Messages] ✅ Mensagem enviada com sucesso');
        toast.success('Mensagem enviada!');
        
        if (onContactUpdate) {
          onContactUpdate(selectedContact.id, messageText, new Date().toISOString());
        }
        
        return true;
      } else {
        throw new Error(data?.error || 'Falha ao enviar mensagem');
      }

    } catch (error: any) {
      console.error('[Chat Messages] ❌ Erro ao enviar mensagem:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedContact, activeInstance, onContactUpdate]);

  // ✅ CALLBACKS PARA REALTIME COM DEBOUNCE ESTÁVEL
  const handleNewMessage = useCallback((newMessage: Message) => {
    console.log('[Chat Messages] 📨 Nova mensagem recebida via realtime:', newMessage);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (exists) {
          console.log('[Chat Messages] ⚠️ Mensagem já existe, ignorando');
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
    }, 100);
  }, [onContactUpdate, selectedContact?.id]);

  const handleMessageUpdate = useCallback((updatedMessage: Message) => {
    console.log('[Chat Messages] 🔄 Mensagem atualizada via realtime:', updatedMessage);
    
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

  // ✅ EFEITO PRINCIPAL - OTIMIZADO PARA EVITAR LOOP
  useEffect(() => {
    const currentContactId = selectedContact?.id;
    
    // Reset state when contact changes
    if (currentContactId !== lastContactIdRef.current) {
      console.log('[Chat Messages] 👤 Contato mudou:', { 
        from: lastContactIdRef.current, 
        to: currentContactId 
      });
      
      lastContactIdRef.current = currentContactId;
      retryCountRef.current = 0;
      isInitializedRef.current = false;
      
      if (currentContactId) {
        loadInitialMessages();
      }
    }
  }, [selectedContact?.id, loadInitialMessages]);

  // ✅ SCROLL PARA BAIXO EM NOVAS MENSAGENS
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
