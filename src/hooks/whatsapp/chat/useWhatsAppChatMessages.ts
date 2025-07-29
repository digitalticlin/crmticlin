
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, Contact, MediaCache } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useAuth } from '@/contexts/AuthContext';
import { MessagingService } from '@/modules/whatsapp/messaging/services/messagingService';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface UseWhatsAppChatMessagesProps {
  selectedContact: Contact | null;
  activeInstance: WhatsAppWebInstance | null;
}

export const useWhatsAppChatMessages = ({ 
  selectedContact, 
  activeInstance 
}: UseWhatsAppChatMessagesProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const offsetRef = useRef(0);

  // ✅ CONVERSÃO OTIMIZADA COM SUPORTE COMPLETO À MÍDIA
  const convertDatabaseMessage = useCallback((dbMessage: any): Message => {
    return {
      id: dbMessage.id,
      text: dbMessage.text || '',
      fromMe: dbMessage.from_me || false,
      timestamp: dbMessage.created_at || new Date().toISOString(),
      status: dbMessage.status || 'sent',
      mediaType: dbMessage.media_type || 'text',
      mediaUrl: dbMessage.media_url || undefined,
      sender: dbMessage.from_me ? 'user' : 'contact',
      time: new Date(dbMessage.created_at || Date.now()).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isIncoming: !dbMessage.from_me,
      // ✅ INCLUIR MEDIA_CACHE COMPLETO
      media_cache: dbMessage.media_cache || null,
      hasMediaCache: !!dbMessage.media_cache,
      mediaCacheId: dbMessage.media_cache?.id || undefined
    };
  }, []);

  // ✅ CARREGAMENTO INICIAL COM MEDIA_CACHE
  const loadMessages = useCallback(async (reset = false) => {
    if (!selectedContact || !activeInstance || !user) return;

    if (reset) {
      setIsLoading(true);
      offsetRef.current = 0;
    } else {
      setIsLoadingMore(true);
    }

    try {
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
        .eq('lead_id', selectedContact.id)
        .eq('whatsapp_number_id', activeInstance.id)
        .order('created_at', { ascending: false })
        .range(offsetRef.current, offsetRef.current + 49);

      if (error) {
        console.error('[useWhatsAppChatMessages] Erro ao carregar mensagens:', error);
        toast.error('Erro ao carregar mensagens');
        return;
      }

      const convertedMessages = (data || []).map(convertDatabaseMessage).reverse();

      if (reset) {
        setMessages(convertedMessages);
      } else {
        setMessages(prev => [...convertedMessages, ...prev]);
      }

      setHasMoreMessages(data?.length === 50);
      offsetRef.current += data?.length || 0;

    } catch (error) {
      console.error('[useWhatsAppChatMessages] Erro crítico:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedContact, activeInstance, user, convertDatabaseMessage]);

  // ✅ ENVIO DE MENSAGEM COM SUPORTE COMPLETO À MÍDIA
  const sendMessage = useCallback(async (
    text: string, 
    mediaType?: string, 
    mediaUrl?: string
  ): Promise<boolean> => {
    if (!selectedContact || !activeInstance || !text.trim()) {
      return false;
    }

    setIsSending(true);

    try {
      // ✅ CRIAR MENSAGEM OTIMISTA PARA FEEDBACK IMEDIATO
      const optimisticId = `temp_${uuidv4()}`;
      const optimisticMessage: Message = {
        id: optimisticId,
        text: text.trim(),
        fromMe: true,
        timestamp: new Date().toISOString(),
        status: 'sending',
        mediaType: (mediaType as any) || 'text',
        mediaUrl: mediaUrl || undefined,
        sender: 'user',
        time: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isIncoming: false,
        isOptimistic: true,
        media_cache: null
      };

      // ✅ ADICIONAR MENSAGEM OTIMISTA IMEDIATAMENTE
      setMessages(prev => [...prev, optimisticMessage]);

      // ✅ ENVIAR VIA MESSAGING SERVICE (JÁ SUPORTA MÍDIA)
      const result = await MessagingService.sendMessage({
        instanceId: activeInstance.id,
        phone: selectedContact.phone,
        message: text.trim(),
        mediaType: (mediaType as any) || 'text',
        mediaUrl: mediaUrl || undefined
      });

      if (result.success) {
        // ✅ ATUALIZAR MENSAGEM OTIMISTA COM DADOS REAIS
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticId 
            ? { 
                ...msg, 
                id: result.messageId || msg.id,
                status: 'sent',
                isOptimistic: false,
                timestamp: result.timestamp || msg.timestamp
              }
            : msg
        ));

        console.log('[useWhatsAppChatMessages] ✅ Mensagem enviada:', {
          messageId: result.messageId,
          mediaType: mediaType || 'text',
          hasMedia: !!mediaUrl
        });

        return true;
      } else {
        // ✅ REMOVER MENSAGEM OTIMISTA EM CASO DE ERRO
        setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
        toast.error(result.error || 'Erro ao enviar mensagem');
        return false;
      }

    } catch (error: any) {
      console.error('[useWhatsAppChatMessages] Erro ao enviar:', error);
      
      // ✅ REMOVER MENSAGEM OTIMISTA EM CASO DE ERRO
      setMessages(prev => prev.filter(msg => msg.isOptimistic));
      toast.error('Erro ao enviar mensagem');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [selectedContact, activeInstance]);

  // ✅ CALLBACK PARA NOVA MENSAGEM (REALTIME)
  const handleNewMessage = useCallback((message: Message) => {
    console.log('[useWhatsAppChatMessages] 📨 Nova mensagem recebida:', {
      messageId: message.id,
      fromMe: message.fromMe,
      mediaType: message.mediaType || 'text',
      hasMediaCache: message.hasMediaCache
    });

    setMessages(prev => {
      // Evitar duplicatas
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) return prev;

      return [...prev, message];
    });
  }, []);

  // ✅ CALLBACK PARA ATUALIZAÇÃO DE MENSAGEM (REALTIME)
  const handleMessageUpdate = useCallback((message: Message) => {
    console.log('[useWhatsAppChatMessages] 🔄 Mensagem atualizada:', {
      messageId: message.id,
      status: message.status,
      mediaType: message.mediaType || 'text'
    });

    setMessages(prev => prev.map(msg => 
      msg.id === message.id ? { ...msg, ...message } : msg
    ));
  }, []);

  // ✅ RECARREGAR QUANDO CONTATO/INSTÂNCIA MUDAR
  useEffect(() => {
    if (selectedContact && activeInstance) {
      console.log('[useWhatsAppChatMessages] 🔄 Recarregando mensagens:', {
        contactId: selectedContact.id,
        instanceId: activeInstance.id
      });
      loadMessages(true);
    } else {
      setMessages([]);
    }
  }, [selectedContact, activeInstance, loadMessages]);

  return {
    messages,
    isLoading,
    isSending,
    hasMoreMessages,
    isLoadingMore,
    sendMessage,
    loadMore: () => loadMessages(false),
    onNewMessage: handleNewMessage,
    onMessageUpdate: handleMessageUpdate
  };
};
