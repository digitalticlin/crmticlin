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

      // FILTRO MULTITENANT: Buscar role do usuário primeiro
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, created_by_user_id')
        .eq('id', user?.id)
        .single();

      if (!profile) {
        throw new Error('Profile não encontrado');
      }

      // Query base na tabela MESSAGES (correta)
      let query = supabase
        .from('messages')
        .select(`
          *,
          media_cache!left (
            id,
            cached_url,
            file_size,
            media_type
          )
        `, { count: 'exact' })
        .eq('lead_id', selectedContact.id);

      // MULTITENANT: Aplicar filtro baseado no role
      if (profile.role === 'admin') {
        // Admin vê mensagens onde created_by_user_id = seu próprio ID
        query = query.eq('created_by_user_id', user?.id);
      } else if (profile.role === 'operational' && profile.created_by_user_id) {
        // Operacional vê mensagens do admin ao qual pertence
        query = query.eq('created_by_user_id', profile.created_by_user_id);
      } else {
        // Fallback seguro
        query = query.eq('created_by_user_id', user?.id);
      }

      // Adicionar filtro de instância apenas se disponível
      if (activeInstanceId) {
        query = query.eq('whatsapp_number_id', activeInstanceId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false }) // Mais recentes primeiro
        .range(from, to);

      if (error) {
        console.error('[WhatsApp Messages Manager] ❌ Erro ao carregar mensagens:', error);
        throw error;
      }

      const messages: Message[] = (data || []).map(messageData => ({
        id: messageData.id,
        text: messageData.text || '',
        content: messageData.text || '', // Compatibilidade
        fromMe: messageData.from_me || false,
        isFromMe: messageData.from_me || false, // Compatibilidade
        timestamp: messageData.created_at || new Date().toISOString(),
        status: messageData.status || 'sent',
        mediaType: messageData.media_type || 'text',
        messageType: messageData.media_type || 'text', // Compatibilidade
        mediaUrl: messageData.media_url || null,
        sender: messageData.from_me ? 'user' : 'contact',
        time: new Date(messageData.created_at || Date.now()).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isIncoming: !messageData.from_me,
        media_cache: messageData.media_cache || null,
        chatId: messageData.lead_id || '', // Para compatibilidade
        instanceId: messageData.whatsapp_number_id || '', // Para compatibilidade
        leadId: messageData.lead_id || ''
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