
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useMessagesRealtime } from '../realtime/useMessagesRealtime';
import { useChatDatabase } from '../useChatDatabase';
import { useCompanyResolver } from '../useCompanyResolver';
import { toast } from 'sonner';
import { normalizeStatus } from './utils';

const MESSAGES_LIMIT = 15; // ✅ OTIMIZADO: 15 mensagens para carregamento mais rápido

export const useWhatsAppChatMessages = (
  selectedContact: Contact | null,
  activeInstance: WhatsAppWebInstance | null,
  onContactUpdate?: (leadId: string, newMessage: any) => void  // ✅ NOVO: callback para notificar contatos
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  
  const { mapDbMessageToMessage } = useChatDatabase();
  const lastContactIdRef = useRef<string | null>(null);
  const lastInstanceIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  
  // 🚀 REFS PARA VALORES ATUAIS: Solução para closure sem dependências
  const selectedContactRef = useRef(selectedContact);
  const activeInstanceRef = useRef(activeInstance);
  const mapDbMessageToMessageRef = useRef(mapDbMessageToMessage);

  // Atualizar refs com valores atuais
  useEffect(() => {
    selectedContactRef.current = selectedContact;
    activeInstanceRef.current = activeInstance;
    mapDbMessageToMessageRef.current = mapDbMessageToMessage;
  });

  // Cleanup na desmontagem
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // 🚀 CACHE INTELIGENTE EM MEMÓRIA
  const messagesCache = useRef(new Map<string, Message[]>());
  const mediaCachePromises = useRef(new Map<string, Promise<any>>());

  // 🚀 FUNÇÃO ESCALONADA: Texto primeiro, mídia depois
  const fetchMessages = useCallback(async (offset = 0, forceRefresh = false) => {
    // 🚀 ACESSAR VALORES ATUAIS VIA REFS
    const currentContact = selectedContactRef.current;
    const currentInstance = activeInstanceRef.current;
    const currentMapper = mapDbMessageToMessageRef.current;
    
    // 🚀 SÓ CARREGA SE TEM CONTATO SELECIONADO
    if (!currentContact || !currentInstance) {
      console.log('[WhatsApp Messages] ⚠️ Aguardando contato/instância ser selecionado');
      return;
    }

    const cacheKey = `${currentContact.id}_${currentInstance.id}`;

    // ✅ CACHE HIT: Usar mensagens já carregadas se não for refresh forçado
    if (!forceRefresh && offset === 0 && messagesCache.current.has(cacheKey)) {
      console.log('[WhatsApp Messages] ⚡ CACHE HIT - carregamento instantâneo:', currentContact.name);
      const cachedMessages = messagesCache.current.get(cacheKey)!;
      setMessages(cachedMessages);
      setCurrentOffset(cachedMessages.length);
      setHasMoreMessages(cachedMessages.length >= MESSAGES_LIMIT);
      setIsLoadingMessages(false);
      return;
    }

    try {
      if (offset === 0) {
        setIsLoadingMessages(true);
      } else {
        setIsLoadingMore(true);
      }

      console.log('[WhatsApp Messages] 🔍 Carregando mensagens (escalonado):', {
        contactId: currentContact.id,
        contactName: currentContact.name,
        instanceId: currentInstance.id,
        offset,
        limit: MESSAGES_LIMIT,
        useCache: !forceRefresh
      });

      // 🚀 FASE 1: MENSAGENS BÁSICAS (RÁPIDO - SEM media_cache)
      const startTime = Date.now();
      const { data: basicMessagesData, error } = await supabase
        .from('messages')
        .select(`
          id,
          text,
          from_me,
          created_at,
          timestamp,
          status,
          media_type,
          media_url,
          lead_id,
          whatsapp_number_id
        `)
        .eq('lead_id', currentContact.id)
        .eq('whatsapp_number_id', currentInstance.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + MESSAGES_LIMIT - 1);

      if (!mountedRef.current) return;

      if (error) {
        console.error('[WhatsApp Messages] ❌ Erro ao buscar mensagens básicas:', error);
        toast.error('Erro ao carregar mensagens');
        return;
      }

      const basicLoadTime = Date.now() - startTime;
      console.log('[WhatsApp Messages] ⚡ FASE 1 concluída:', {
        total: basicMessagesData?.length || 0,
        loadTime: `${basicLoadTime}ms`,
        contactName: currentContact.name
      });

      // 🚀 CONVERSÃO RÁPIDA (sem media_cache ainda)
      const basicMessages = (basicMessagesData || []).map(msg => currentMapper({
        ...msg,
        media_cache: [] // Vazio inicialmente
      }));

      if (offset === 0) {
        // ✅ UI INSTANTÂNEA: Mostrar mensagens básicas imediatamente
        const orderedMessages = basicMessages.reverse();
        setMessages(orderedMessages);
        setCurrentOffset(MESSAGES_LIMIT);
        
        // ✅ CACHE: Salvar para próximas visitas
        messagesCache.current.set(cacheKey, orderedMessages);
      } else {
        // ✅ PAGINAÇÃO
        setMessages(prev => [...basicMessages.reverse(), ...prev]);
        setCurrentOffset(prev => prev + MESSAGES_LIMIT);
      }

      setHasMoreMessages((basicMessagesData?.length || 0) === MESSAGES_LIMIT);

      // 🚀 FASE 2: CARREGAR MÍDIA EM BACKGROUND
      const mediaMessages = basicMessagesData?.filter(msg => 
        msg.media_type && msg.media_type !== 'text'
      ) || [];

      if (mediaMessages.length > 0) {
        console.log('[WhatsApp Messages] 🎯 FASE 2 iniciada:', {
          mediaMessages: mediaMessages.length,
          contactName: currentContact.name
        });

                 // Carregar mídia em background sem bloquear UI
         Promise.all(
           mediaMessages.map(async (msg) => {
             try {
               // ✅ CORREÇÃO: Buscar media_cache diretamente pela foreign key
               const { data: mediaCacheData, error: mediaError } = await supabase
                 .from('media_cache')
                 .select(`
                   id,
                   base64_data,
                   original_url,
                   cached_url,
                   file_size,
                   media_type,
                   file_name
                 `)
                 .eq('message_id', msg.id)
                 .maybeSingle();

               if (mediaError) {
                 console.warn('[WhatsApp Messages] ⚠️ Erro carregando media_cache para:', msg.id, mediaError);
                 return; // Continuar sem falhar
               }

                             if (mediaCacheData && mountedRef.current) {
                 console.log('[WhatsApp Messages] ✅ Media cache carregado para:', msg.id, {
                   hasBase64: !!mediaCacheData.base64_data,
                   mimeType: mediaCacheData.mime_type,
                   mediaType: mediaCacheData.media_type
                 });

                 // ✅ ATUALIZAÇÃO SUAVE: Só atualizar a mensagem específica
                 setMessages(prevMessages => 
                   prevMessages.map(prevMsg => 
                     prevMsg.id === msg.id 
                       ? {
                           ...prevMsg,
                           media_cache: mediaCacheData,
                           mediaUrl: mediaCacheData.base64_data 
                             ? `data:${mediaCacheData.mime_type || 'application/octet-stream'};base64,${mediaCacheData.base64_data}`
                             : prevMsg.mediaUrl
                         }
                       : prevMsg
                   )
                 );

                 // ✅ ATUALIZAR CACHE TAMBÉM
                 if (offset === 0) {
                   const currentCached = messagesCache.current.get(cacheKey);
                   if (currentCached) {
                     const updatedCache = currentCached.map(cachedMsg =>
                       cachedMsg.id === msg.id
                         ? {
                             ...cachedMsg,
                             media_cache: mediaCacheData,
                             mediaUrl: mediaCacheData.base64_data 
                               ? `data:${mediaCacheData.mime_type || 'application/octet-stream'};base64,${mediaCacheData.base64_data}`
                               : cachedMsg.mediaUrl
                           }
                         : cachedMsg
                     );
                     messagesCache.current.set(cacheKey, updatedCache);
                   }
                 }
               } else {
                 console.log('[WhatsApp Messages] ⚠️ Media cache não encontrado para:', msg.id);
               }
            } catch (error) {
              console.error('[WhatsApp Messages] ⚠️ Erro carregando mídia para:', msg.id, error);
            }
          })
        ).then(() => {
          if (mountedRef.current) {
            console.log('[WhatsApp Messages] ✅ FASE 2 concluída - todas as mídias carregadas');
          }
        });
      }

    } catch (error) {
      if (!mountedRef.current) return;
      console.error('[WhatsApp Messages] ❌ Erro geral ao buscar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      if (!mountedRef.current) return;
      setIsLoadingMessages(false);
      setIsLoadingMore(false);
    }
  }, []); // 🚀 SEM DEPENDÊNCIAS mas usando refs para valores atuais

  // Carregar mais mensagens
  const loadMoreMessages = useCallback(async () => {
    const currentContact = selectedContactRef.current;
    if (!currentContact || !hasMoreMessages || isLoadingMore) return;
    await fetchMessages(currentOffset);
  }, [currentOffset, hasMoreMessages, isLoadingMore, fetchMessages]);

  // 🚀 NOVA: Função para adicionar nova mensagem sem resetar lista
  const addNewMessage = useCallback((newMessage: Message) => {
    console.log('[WhatsApp Messages] 🚀 Tentando adicionar mensagem:', newMessage.id);
    
    // A verificação do contato será feita pelo realtime hook antes de chamar esta função
    setMessages(prevMessages => {
      // Verificar se a mensagem já existe (evitar duplicatas)
      const messageExists = prevMessages.some(msg => msg.id === newMessage.id);
      if (messageExists) {
        console.log('[WhatsApp Messages] ⚠️ Mensagem duplicada ignorada:', newMessage.id);
        return prevMessages;
      }

      console.log('[WhatsApp Messages] ➕ ✅ ADICIONANDO nova mensagem:', {
        messageId: newMessage.id,
        fromMe: newMessage.fromMe,
        text: newMessage.text?.substring(0, 50)
      });

      // Adicionar mensagem no final (mensagens mais recentes ficam no final)
      return [...prevMessages, newMessage];
    });

    // 🎯 SCROLL AUTOMÁTICO: Para TODAS as mensagens novas (enviadas e recebidas)
    console.log('[WhatsApp Messages] 🔽 Auto-scroll para mensagem:', {
      fromMe: newMessage.fromMe,
      messageId: newMessage.id,
      text: newMessage.text?.substring(0, 30)
    });
    // O componente useMessagesList detecta mudanças e faz scroll automático
  }, []);

  // 🚀 NOVA: Função para atualizar status de mensagem
  const updateMessageStatus = useCallback((messageId: string, newStatus: 'sending' | 'sent' | 'delivered' | 'read' | 'failed') => {
    setMessages(prevMessages => 
      prevMessages.map(message => 
        message.id === messageId 
          ? { ...message, status: newStatus }
          : message
      )
    );
    
    console.log('[WhatsApp Messages] 🔄 Status atualizado:', { messageId, newStatus });
  }, []);

  // 🚀 NOVA: Função para atualizar mensagem otimista com dados reais
  const updateOptimisticMessage = useCallback((tempId: string, updates: Partial<Message>) => {
    setMessages(prevMessages => 
      prevMessages.map(message => 
        message.id === tempId 
          ? { ...message, ...updates }
          : message
      )
    );
    
    console.log('[WhatsApp Messages] 🔄 Mensagem otimista atualizada:', { tempId, updates });
  }, []);

  // 🚀 NOVA: Função para substituir mensagem otimista por confirmação real
  const replaceOptimisticMessage = useCallback((optimisticId: string, realMessage: Message) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === optimisticId 
          ? realMessage
          : msg
      )
    );
    
    console.log('[WhatsApp Messages] 🔄 Mensagem otimista substituída:', { optimisticId, realId: realMessage.id });
  }, []);

  // 🚀 NOVA: Função para atualizar status de mensagens via realtime
  const onMessageUpdate = useCallback((message: Message, rawMessage?: any) => {
    console.log('[WhatsApp Messages] 🔄 Atualizando mensagem via realtime:', {
      messageId: message.id,
      status: message.status
    });
    
    updateMessageStatus(message.id, message.status || 'sent');
  }, [updateMessageStatus]);

  // Enviar mensagem
  const sendMessage = useCallback(async (
    text: string, 
    mediaType?: 'text' | 'image' | 'video' | 'audio' | 'document',
    mediaUrl?: string
  ): Promise<boolean> => {
    const currentContact = selectedContactRef.current;
    const currentInstance = activeInstanceRef.current;
    
    if (!currentContact || !currentInstance || !text.trim()) {
      return false;
    }

    // 🚀 UI OTIMISTA: Criar mensagem temporária imediatamente com MÍDIA
    const optimisticTimestamp = new Date().toISOString();
    const optimisticMessage = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      fromMe: true,
      timestamp: optimisticTimestamp,
      status: 'sending' as const,
      mediaType: mediaType || 'text' as const,
      mediaUrl: mediaUrl || undefined, // ✅ IMPORTANTE: Manter URL para renderização imediata
      sender: 'user' as const,
      time: new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
      isIncoming: false,
      isOptimistic: true, // 🆕 Flag PRINCIPAL para identificar mensagens otimistas
      optimisticTimestamp: optimisticTimestamp, // 🆕 Timestamp específico para matching
      // 🚀 NOVO: Se tem mídia, criar cache otimista para renderização imediata
      media_cache: mediaUrl && mediaUrl.startsWith('data:') ? {
        id: `temp_cache_${Date.now()}`,
        base64_data: mediaUrl.split(',')[1], // Extrair base64 puro
        original_url: null,
        file_size: null,
        media_type: mediaType || 'document'
      } : null
    };

    console.log('[WhatsApp Messages] 🚀 UI OTIMISTA: Criando mensagem com mídia:', {
      messageId: optimisticMessage.id,
      text: optimisticMessage.text?.substring(0, 30),
      mediaType,
      hasMediaUrl: !!mediaUrl,
      hasMediaCache: !!optimisticMessage.media_cache,
      timestamp: optimisticTimestamp,
      isOptimistic: true
    });

    // ✅ MOSTRAR MENSAGEM IMEDIATAMENTE NA UI (COM MÍDIA RENDERIZADA)
    addNewMessage(optimisticMessage);

    try {
      setIsSending(true);

      console.log('[WhatsApp Messages] 📤 Enviando mensagem para API:', {
        contactId: currentContact.id,
        contactName: currentContact.name,
        instanceId: currentInstance.id,
        phone: currentContact.phone,
        mediaType: mediaType || 'text',
        hasMediaUrl: !!mediaUrl
      });

      // 🚀 ENVIAR PARA API EM PARALELO
      const { data, error } = await supabase.functions.invoke('whatsapp_messaging_service', {
        body: {
          action: 'send_message',
          instanceId: currentInstance.id,
          phone: currentContact.phone,
          message: text,
          mediaType: mediaType || 'text',
          mediaUrl: mediaUrl || null
        }
      });

      if (error) {
        console.error('[WhatsApp Messages] ❌ Erro ao enviar mensagem:', error);
        
        // 🔄 ATUALIZAR MENSAGEM OTIMISTA PARA FALHA
        updateMessageStatus(optimisticMessage.id, 'failed');
        
        toast.error('Erro ao enviar mensagem');
        return false;
      }

      console.log('[WhatsApp Messages] ✅ Mensagem enviada com sucesso:', data);

      // ✅ ATUALIZAR MENSAGEM OTIMISTA PARA ENVIADA
      // Se a API retornou um ID real, usar ele
      if (data?.data?.messageId) {
        updateOptimisticMessage(optimisticMessage.id, {
          id: data.data.messageId,
          status: 'sent',
          isOptimistic: false
        });
      } else {
        updateMessageStatus(optimisticMessage.id, 'sent');
      }

      return true;

    } catch (error) {
      console.error('[WhatsApp Messages] ❌ Erro geral ao enviar mensagem:', error);
      
      // 🔄 ATUALIZAR MENSAGEM OTIMISTA PARA FALHA
      updateMessageStatus(optimisticMessage.id, 'failed');
      
      toast.error('Erro ao enviar mensagem');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [addNewMessage, updateMessageStatus, updateOptimisticMessage]);

  // 🚀 NOVA: Função para tentar reenviar mensagem falhada
  const retryFailedMessage = useCallback(async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.status !== 'failed') {
      console.log('[WhatsApp Messages] ⚠️ Mensagem não encontrada ou não falhada:', messageId);
      return false;
    }

    console.log('[WhatsApp Messages] 🔄 Tentando reenviar mensagem falhada:', messageId);
    
    // Atualizar status para sending
    updateMessageStatus(messageId, 'sending');
    
    // Tentar enviar novamente
    const success = await sendMessage(message.text, message.mediaType, message.mediaUrl);
    
    if (success) {
      // Se sucesso, remover mensagem falhada (a nova já foi adicionada)
      setMessages(prevMessages => prevMessages.filter(m => m.id !== messageId));
    } else {
      // Se falhou novamente, manter como failed
      updateMessageStatus(messageId, 'failed');
    }
    
    return success;
  }, [messages, updateMessageStatus, sendMessage]);

  // Hook de realtime para mensagens
  useMessagesRealtime(
    selectedContact,
    activeInstance,
    addNewMessage,
    onMessageUpdate,
    messages,  // ✅ NOVO: passar mensagens atuais
    replaceOptimisticMessage,  // ✅ NOVO: callback para substituir mensagens otimistas
    onContactUpdate  // ✅ NOVO: callback para notificar contatos sobre novas mensagens
  );

  // 🚀 CARREGAR MENSAGENS APENAS QUANDO IDs MUDAREM (evitar loops)
  useEffect(() => {
    const newContactId = selectedContact?.id || null;
    const newInstanceId = activeInstance?.id || null;
    
    const contactChanged = newContactId !== lastContactIdRef.current;
    const instanceChanged = newInstanceId !== lastInstanceIdRef.current;
    
    // 🚀 EVITAR LOOPS: Só executar se realmente mudou
    if (!contactChanged && !instanceChanged) {
      return;
    }

    console.log('[WhatsApp Messages] 🔄 Mudança detectada:', {
      newContactId,
      newInstanceId,
        previousContactId: lastContactIdRef.current,
        previousInstanceId: lastInstanceIdRef.current
      });

    // Reset estado
      setMessages([]);
      setCurrentOffset(0);
      setHasMoreMessages(true);
      setIsLoadingMessages(false);
      setIsLoadingMore(false);

    // Atualizar refs ANTES de carregar
    lastContactIdRef.current = newContactId;
    lastInstanceIdRef.current = newInstanceId;

    // Carregar mensagens se há contato selecionado
      if (selectedContact && activeInstance) {
      console.log('[WhatsApp Messages] 🚀 Carregando mensagens do contato:', selectedContact.name);
        fetchMessages(0, true);
    }
  }, [selectedContact?.id, activeInstance?.id, fetchMessages]);



  return {
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    isSending,
    sendMessage,
    loadMoreMessages,
    fetchMessages,
    addNewMessage,
    updateMessageStatus,
    retryFailedMessage
  };
};
