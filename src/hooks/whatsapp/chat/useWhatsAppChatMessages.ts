
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useMessageRealtime } from './hooks/useMessageRealtime';
import { useChatDatabase } from '../useChatDatabase';
import { useCompanyResolver } from '../useCompanyResolver';
import { toast } from 'sonner';
import { normalizeStatus } from './helpers/messageHelpers';

const MESSAGES_LIMIT = 20; // Reduzido para 20 mensagens por página

export const useWhatsAppChatMessages = (
  selectedContact: Contact | null,
  activeInstance: WhatsAppWebInstance | null
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
  
  // 🚀 FUNÇÃO ESTÁVEL: Acessa valores via refs, sem dependências instáveis
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

    try {
      if (offset === 0) {
        setIsLoadingMessages(true);
      } else {
        setIsLoadingMore(true);
      }

      console.log('[WhatsApp Messages] 🔍 Carregando mensagens:', {
        contactId: currentContact.id,
        contactName: currentContact.name,
        instanceId: currentInstance.id,
        offset,
        limit: MESSAGES_LIMIT
      });

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', currentContact.id)
        .eq('whatsapp_number_id', currentInstance.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + MESSAGES_LIMIT - 1);

      if (!mountedRef.current) return;

      if (error) {
        console.error('[WhatsApp Messages] ❌ Erro ao buscar mensagens:', error);
        toast.error('Erro ao carregar mensagens');
        return;
      }

      console.log('[WhatsApp Messages] ✅ Mensagens carregadas:', {
        total: messagesData?.length || 0,
        offset,
        contactName: currentContact.name
      });

      const convertedMessages = (messagesData || []).map(currentMapper);

      if (offset === 0) {
        setMessages(convertedMessages);
        setCurrentOffset(MESSAGES_LIMIT);
      } else {
        setMessages(prev => [...prev, ...convertedMessages]);
        setCurrentOffset(prev => prev + MESSAGES_LIMIT);
      }

      setHasMoreMessages((messagesData?.length || 0) === MESSAGES_LIMIT);

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

    try {
      setIsSending(true);

      console.log('[WhatsApp Messages] 📤 Enviando mensagem:', {
        contactId: currentContact.id,
        contactName: currentContact.name,
        instanceId: currentInstance.id,
        phone: currentContact.phone,
        mediaType: mediaType || 'text',
        hasMediaUrl: !!mediaUrl
      });

      // 🚀 CORREÇÃO: Usar parâmetros corretos da edge function com mídia
      const { data, error } = await supabase.functions.invoke('whatsapp_messaging_service', {
        body: {
          action: 'send_message', // ✅ CORRIGIDO: era 'send'
          instanceId: currentInstance.id,
          phone: currentContact.phone,
          message: text,
          mediaType: mediaType || 'text', // ✅ NOVO: TIPO DE MÍDIA
          mediaUrl: mediaUrl || null      // ✅ NOVO: URL DE MÍDIA
        }
      });

      if (error) {
        console.error('[WhatsApp Messages] ❌ Erro ao enviar mensagem:', error);
        toast.error('Erro ao enviar mensagem');
        return false;
      }

      console.log('[WhatsApp Messages] ✅ Mensagem enviada com sucesso:', data);

      // Recarregar mensagens após envio
      setTimeout(() => {
        fetchMessages(0, true);
      }, 500);

      return true;

    } catch (error) {
      console.error('[WhatsApp Messages] ❌ Erro geral ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [fetchMessages]);

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

    // 🎯 SCROLL INTELIGENTE: Apenas para mensagens próprias ou se usuário está no final
    if (newMessage.fromMe) {
      console.log('[WhatsApp Messages] 📱 Scroll automático: mensagem própria');
      // O componente useMessagesList já cuida do scroll para mensagens próprias
    } else {
      console.log('[WhatsApp Messages] 💬 Nova mensagem recebida: sem scroll forçado');
      // Para mensagens recebidas, não forçar scroll - deixar usuário decidir
    }
  }, []);

  // 🚀 NOVA: Função para atualizar status de mensagem
  const updateMessageStatus = useCallback((messageId: string, newStatus: 'sent' | 'delivered' | 'read') => {
    setMessages(prevMessages => 
      prevMessages.map(message => 
        message.id === messageId 
          ? { ...message, status: newStatus }
          : message
      )
    );
    
    console.log('[WhatsApp Messages] 🔄 Status atualizado:', { messageId, newStatus });
  }, []);

  // Hook de realtime para mensagens
  useMessageRealtime({
    selectedContact,
    activeInstance,
    onMessageUpdate: useCallback((newMessage) => {
      console.log('[WhatsApp Messages] 🔄 Realtime trigger recebido:', {
        messageId: newMessage?.id,
        text: newMessage?.text?.substring(0, 30)
      });

      // 🚀 CORREÇÃO: Usar addNewMessage diretamente sem verificações de refs
      if (newMessage && newMessage.id) {
        // Converter payload da mensagem para formato Message
        const messageForUI = {
          id: newMessage.id,
          text: newMessage.text || '',
          fromMe: newMessage.from_me || false,
          timestamp: newMessage.created_at || newMessage.timestamp,
          status: newMessage.status || 'sent',
          mediaType: newMessage.media_type || 'text',
          mediaUrl: newMessage.media_url,
          sender: newMessage.from_me ? 'user' as const : 'contact' as const,
          time: new Date(newMessage.created_at || newMessage.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          isIncoming: !newMessage.from_me
        };

        console.log('[WhatsApp Messages] ➕ ✅ ADICIONANDO mensagem via realtime:', {
          messageId: messageForUI.id,
          fromMe: messageForUI.fromMe,
          text: messageForUI.text?.substring(0, 50)
        });

        addNewMessage(messageForUI);
      } else {
        // Fallback para refresh completo apenas se não conseguir processar a mensagem
        console.log('[WhatsApp Messages] 🔄 Fallback: refresh completo');
        fetchMessages(0, true);
      }
    }, [addNewMessage, fetchMessages])
  });

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
  }, [selectedContact?.id, activeInstance?.id]); // 🚀 APENAS IDs como dependências

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
    updateMessageStatus
  };
};
