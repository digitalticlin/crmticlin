/**
 * 🎯 WHATSAPP CHAT MESSAGES MANAGER
 *
 * Hook especializado para gerenciamento de mensagens
 * Isolado e otimizado com React Query
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { whatsappChatMessagesQueryKeys, whatsappChatInvalidation } from '../queryKeys';
import { useWhatsAppChatCoordinator } from '../core/useWhatsAppChatCoordinator';
import { Contact, Message } from '@/types/chat';

interface UseWhatsAppMessagesManagerParams {
  selectedContact: Contact | null;
  activeInstanceId?: string | null;
  enableAutoRefresh?: boolean;
}

interface UseWhatsAppMessagesManagerReturn {
  // Dados básicos
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;

  // Ações
  loadMore: () => Promise<void>;
  refresh: () => void;
  sendMessage: (content: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
  markAsRead: (contactId: string) => Promise<void>;

  // Estados
  isSending: boolean;
  lastMessage: Message | null;
}

const MESSAGES_PER_PAGE = 50;

export const useWhatsAppMessagesManager = ({
  selectedContact,
  activeInstanceId,
  enableAutoRefresh = true
}: UseWhatsAppMessagesManagerParams): UseWhatsAppMessagesManagerReturn => {

  console.log('[WhatsApp Messages Manager] 🎯 Hook inicializado', {
    hasContact: !!selectedContact,
    contactId: selectedContact?.id,
    hasInstance: !!activeInstanceId
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const coordinator = useWhatsAppChatCoordinator();

  // Estados locais
  const [lastMessage, setLastMessage] = useState<Message | null>(null);

  // Query para mensagens com scroll infinito
  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchMessages
  } = useInfiniteQuery({
    queryKey: whatsappChatMessagesQueryKeys.infinite(
      selectedContact?.id || '',
      activeInstanceId || '',
      user?.id || ''
    ),
    queryFn: async ({ pageParam = 0 }) => {
      if (!selectedContact?.id || !activeInstanceId || !user?.id) {
        return { data: [], hasMore: false };
      }

      console.log('[WhatsApp Messages Manager] 💬 Carregando mensagens:', {
        contactId: selectedContact.id,
        instanceId: activeInstanceId,
        page: pageParam
      });

      const from = pageParam * MESSAGES_PER_PAGE;
      const to = from + MESSAGES_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select(`
          id,
          content,
          message_type,
          is_from_me,
          timestamp,
          media_url,
          media_type,
          chat_id,
          instance_id,
          status
        `)
        .eq('chat_id', selectedContact.id)
        .eq('instance_id', activeInstanceId)
        .order('timestamp', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('[WhatsApp Messages Manager] ❌ Erro ao carregar mensagens:', error);
        throw error;
      }

      const messages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        content: msg.content || '',
        messageType: msg.message_type || 'text',
        isFromMe: msg.is_from_me || false,
        timestamp: msg.timestamp || '',
        mediaUrl: msg.media_url || null,
        mediaType: msg.media_type || null,
        chatId: msg.chat_id || '',
        instanceId: msg.instance_id || '',
        status: msg.status || 'sent'
      }));

      // Reverter ordem para mostrar mais antigas primeiro
      messages.reverse();

      const hasMore = data ? data.length === MESSAGES_PER_PAGE : false;

      return {
        data: messages,
        hasMore,
        nextPage: hasMore ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!selectedContact?.id && !!activeInstanceId && !!user?.id,
    staleTime: 10000, // 10 segundos
    refetchOnWindowFocus: false,
    refetchInterval: enableAutoRefresh ? 30000 : false // Auto-refresh a cada 30s
  });

  // Mutation para envio de mensagens
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, mediaType, mediaUrl }: { content: string; mediaType?: string; mediaUrl?: string }) => {
      if (!selectedContact?.id || !activeInstanceId || !user?.id) {
        throw new Error('Dados insuficientes para envio');
      }

      console.log('[WhatsApp Messages Manager] 📤 Enviando mensagem:', {
        contactId: selectedContact.id,
        hasMedia: !!mediaUrl,
        contentPreview: content.substring(0, 50)
      });

      // Enviar via API do WhatsApp
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          instanceId: activeInstanceId,
          chatId: selectedContact.id,
          content,
          mediaType,
          mediaUrl
        }
      });

      if (error) {
        console.error('[WhatsApp Messages Manager] ❌ Erro ao enviar mensagem:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('[WhatsApp Messages Manager] ✅ Mensagem enviada com sucesso');

      // Invalidar queries de mensagens
      queryClient.invalidateQueries({
        queryKey: whatsappChatMessagesQueryKeys.byContact(
          selectedContact?.id || '',
          activeInstanceId || '',
          user?.id || ''
        )
      });

      // Notificar coordinator
      coordinator.emit({
        type: 'message:new',
        payload: { contactId: selectedContact?.id, message: data },
        priority: 'high',
        source: 'MessagesManager'
      });
    },
    onError: (error) => {
      console.error('[WhatsApp Messages Manager] ❌ Falha no envio:', error);
    }
  });

  // Mutation para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (contactId: string) => {
      console.log('[WhatsApp Messages Manager] 👁️ Marcando como lida:', contactId);

      const { error } = await supabase
        .from('whatsapp_chats')
        .update({ unread_count: 0 })
        .eq('id', contactId);

      if (error) {
        console.error('[WhatsApp Messages Manager] ❌ Erro ao marcar como lida:', error);
        throw error;
      }
    },
    onSuccess: (_, contactId) => {
      console.log('[WhatsApp Messages Manager] ✅ Marcado como lida');

      // Invalidar contatos para atualizar contador
      queryClient.invalidateQueries({
        predicate: whatsappChatInvalidation.allContacts(activeInstanceId || '', user?.id || '')
      });

      // Notificar coordinator
      coordinator.emit({
        type: 'message:read',
        payload: { contactId },
        priority: 'normal',
        source: 'MessagesManager'
      });
    }
  });

  // Mensagens finais (todas as páginas unificadas)
  const messages = useMemo(() => {
    if (messagesData?.pages) {
      return messagesData.pages.flatMap(page => page.data);
    }
    return [];
  }, [messagesData]);

  // Atualizar última mensagem
  useEffect(() => {
    if (messages.length > 0) {
      const newest = messages[messages.length - 1];
      setLastMessage(newest);
    }
  }, [messages]);

  // Ações
  const loadMore = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return;

    console.log('[WhatsApp Messages Manager] 📄 Carregando mensagens mais antigas');
    await fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refresh = useCallback(() => {
    console.log('[WhatsApp Messages Manager] 🔄 Refresh solicitado');

    coordinator.emit({
      type: 'message:new',
      payload: { action: 'refresh', contactId: selectedContact?.id },
      priority: 'high',
      source: 'MessagesManager'
    });

    refetchMessages();
  }, [coordinator, selectedContact?.id, refetchMessages]);

  const sendMessage = useCallback(async (content: string, mediaType?: string, mediaUrl?: string) => {
    try {
      await sendMessageMutation.mutateAsync({ content, mediaType, mediaUrl });
      return true;
    } catch (error) {
      console.error('[WhatsApp Messages Manager] ❌ Erro no envio:', error);
      return false;
    }
  }, [sendMessageMutation]);

  const markAsRead = useCallback(async (contactId: string) => {
    try {
      await markAsReadMutation.mutateAsync(contactId);
    } catch (error) {
      console.error('[WhatsApp Messages Manager] ❌ Erro ao marcar como lida:', error);
    }
  }, [markAsReadMutation]);

  // Auto-marcar como lida quando contato é selecionado
  useEffect(() => {
    if (selectedContact?.id && selectedContact.unreadCount > 0) {
      const timer = setTimeout(() => {
        markAsRead(selectedContact.id);
      }, 2000); // 2 segundos após selecionar

      return () => clearTimeout(timer);
    }
  }, [selectedContact?.id, selectedContact?.unreadCount, markAsRead]);

  return {
    // Dados
    messages,
    isLoading: isLoading && messages.length === 0,
    isLoadingMore: isFetchingNextPage,
    hasMore: hasNextPage || false,

    // Ações
    loadMore,
    refresh,
    sendMessage,
    markAsRead,

    // Estados
    isSending: sendMessageMutation.isPending,
    lastMessage
  };
};