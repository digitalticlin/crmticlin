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
import { useMessagesRealtime } from '@/hooks/whatsapp/realtime/useMessagesRealtime';

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

  // Stats de realtime (WebSocket)
  realtimeConnected: boolean;
  realtimeTotalEvents: number;
}

const MESSAGES_PER_PAGE = 20; // ✅ CORREÇÃO: 20 mensagens por página para scroll infinito otimizado

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
    staleTime: 0, // ✅ CORREÇÃO: 0ms para permitir refetch imediato via realtime
    refetchOnWindowFocus: true, // ✅ CORREÇÃO: Habilitar para sincronizar ao focar
    initialPageParam: 0
  });

  // WebSocket Real-time para mensagens (substitui polling)
  const realtimeMessages = useMessagesRealtime({
    selectedContact,
    activeInstance: activeInstanceId ? {
      id: activeInstanceId,
      instance_name: '',
      connection_status: 'connected'
    } : null,
    onNewMessage: useCallback((message: any) => {
      console.log('[WhatsApp Messages Manager] 🔥 Nova mensagem via WebSocket:', message.id);

      const queryKey = whatsappChatMessagesQueryKeys.infinite(
        selectedContact?.id || '',
        activeInstanceId || '',
        user?.id || ''
      );

      // ATUALIZAR cache diretamente
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;

        let messageReplaced = false;

        // Primeiro: tentar SUBSTITUIR mensagem temp (se from_me)
        const newPages = old.pages.map((page: any) => {
          const newData = page.data.map((msg: Message) => {
            // Se for temp e o texto bater, SUBSTITUIR
            if (msg.id.startsWith('temp-') && msg.text === message.text && message.fromMe) {
              console.log('[WhatsApp Messages Manager] 🔄 Substituindo mensagem temp:', msg.id, '→', message.id);
              messageReplaced = true;
              return message;
            }
            return msg;
          });

          return {
            ...page,
            data: newData
          };
        });

        // Se substituiu, retornar
        if (messageReplaced) {
          return {
            ...old,
            pages: newPages
          };
        }

        // Segundo: verificar se mensagem real já existe
        const exists = old.pages.some((page: any) =>
          page.data.some((msg: Message) => msg.id === message.id)
        );

        if (exists) {
          console.log('[WhatsApp Messages Manager] ⚠️ Mensagem já existe, ignorando');
          return old;
        }

        // Terceiro: se não substituiu e não existe, adicionar nova mensagem
        console.log('[WhatsApp Messages Manager] ✅ Nova mensagem via WebSocket:', {
          id: message.id,
          fromMe: message.fromMe,
          text: message.text?.substring(0, 30)
        });

        const lastPageIndex = newPages.length - 1;
        newPages[lastPageIndex] = {
          ...newPages[lastPageIndex],
          data: [...newPages[lastPageIndex].data, message]
        };

        return {
          ...old,
          pages: newPages
        };
      });
    }, [selectedContact?.id, activeInstanceId, user?.id, queryClient]),
    onMessageUpdate: useCallback((message: any) => {
      console.log('[WhatsApp Messages Manager] 🔄 Mensagem atualizada via WebSocket:', message.id, 'Status:', message.status);

      const queryKey = whatsappChatMessagesQueryKeys.infinite(
        selectedContact?.id || '',
        activeInstanceId || '',
        user?.id || ''
      );

      // ATUALIZAR status diretamente no cache
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;

        const newPages = old.pages.map((page: any) => ({
          ...page,
          data: page.data.map((msg: Message) => {
            if (msg.id === message.id) {
              console.log('[WhatsApp Messages Manager] ✅ Atualizando status:', msg.status, '→', message.status);
              return {
                ...msg,
                ...message,
                status: message.status || msg.status
              };
            }
            return msg;
          })
        }));

        return {
          ...old,
          pages: newPages
        };
      });
    }, [selectedContact?.id, activeInstanceId, user?.id, queryClient]),
    enabled: enableAutoRefresh && !!selectedContact?.id && !!activeInstanceId
  });

  // Mutation para envio de mensagens COM OPTIMISTIC UPDATE
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, mediaType, mediaUrl }: { content: string; mediaType?: string; mediaUrl?: string }) => {
      if (!selectedContact?.id || !activeInstanceId || !user?.id) {
        throw new Error('Dados insuficientes para envio');
      }

      console.log('[WhatsApp Messages Manager] 📤 Enviando mensagem:', {
        contactId: selectedContact.id,
        phone: selectedContact.phone,
        hasMedia: !!mediaUrl,
        contentPreview: content.substring(0, 50)
      });

      // Se houver mídia sem legenda, enviar com espaço em branco para evitar erro 400
      const messageContent = content || (mediaUrl ? ' ' : '');

      // Enviar via Edge Function WhatsApp (isolada - RPC direta)
      const { data, error } = await supabase.functions.invoke('whatsapp_messaging_service', {
        body: {
          action: 'send_message',
          instanceId: activeInstanceId,
          phone: selectedContact.phone,
          message: messageContent,
          mediaType: mediaType || 'text',
          mediaUrl: mediaUrl || null
        }
      });

      if (error) {
        console.error('[WhatsApp Messages Manager] ❌ Erro ao enviar mensagem:', error);
        throw error;
      }

      return data;
    },
    onMutate: async ({ content, mediaType, mediaUrl }) => {
      console.log('[WhatsApp Messages Manager] ⚡ OPTIMISTIC UPDATE - Adicionando mensagem temporária');

      // Cancelar queries em andamento
      const queryKey = whatsappChatMessagesQueryKeys.infinite(
        selectedContact?.id || '',
        activeInstanceId || '',
        user?.id || ''
      );

      await queryClient.cancelQueries({ queryKey });

      // Snapshot do estado anterior (para rollback)
      const previousMessages = queryClient.getQueryData(queryKey);

      // Criar mensagem otimista
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        text: content,
        content: content,
        fromMe: true,
        isFromMe: true,
        timestamp: new Date().toISOString(),
        status: 'pending',
        mediaType: (mediaType || 'text') as any,
        messageType: (mediaType || 'text') as any,
        mediaUrl: mediaUrl || null,
        sender: 'user',
        time: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isIncoming: false,
        media_cache: null,
        chatId: selectedContact?.id || '',
        instanceId: activeInstanceId || '',
        leadId: selectedContact?.id || ''
      };

      // Atualizar cache IMEDIATAMENTE
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) {
          return {
            pages: [{ data: [optimisticMessage], hasMore: false }],
            pageParams: [0]
          };
        }

        // Adicionar mensagem na última página
        const newPages = [...old.pages];
        const lastPageIndex = newPages.length - 1;
        newPages[lastPageIndex] = {
          ...newPages[lastPageIndex],
          data: [...newPages[lastPageIndex].data, optimisticMessage]
        };

        return {
          ...old,
          pages: newPages
        };
      });

      console.log('[WhatsApp Messages Manager] ✅ Mensagem otimista adicionada ao cache');

      return { previousMessages, optimisticMessage };
    },
    onSuccess: (data, variables, context) => {
      console.log('[WhatsApp Messages Manager] ✅ Mensagem enviada com sucesso', {
        tempId: context?.optimisticMessage?.id,
        realId: data?.id || data?.message_id
      });

      // IMPORTANTE: Não fazer nada aqui!
      // O WebSocket vai detectar o INSERT e fazer a substituição automaticamente
      // Isso evita duplicação (onSuccess + WebSocket fazendo a mesma coisa)

      console.log('[WhatsApp Messages Manager] ⏳ Aguardando WebSocket substituir mensagem temp');

      // Notificar coordinator
      coordinator.emit({
        type: 'message:new',
        payload: { contactId: selectedContact?.id, message: data },
        priority: 'high',
        source: 'MessagesManager'
      });
    },
    onError: (error, variables, context) => {
      console.error('[WhatsApp Messages Manager] ❌ Falha no envio - revertendo optimistic update');

      // Rollback: restaurar estado anterior
      if (context?.previousMessages) {
        const queryKey = whatsappChatMessagesQueryKeys.infinite(
          selectedContact?.id || '',
          activeInstanceId || '',
          user?.id || ''
        );
        queryClient.setQueryData(queryKey, context.previousMessages);
      }
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

  // ✅ CORREÇÃO: Mensagens finais (todas as páginas unificadas E REORDENADAS)
  const messages = useMemo(() => {
    if (messagesData?.pages) {
      const allMessages = messagesData.pages.flatMap(page => page.data);

      // ✅ CRÍTICO: Reordenar TODAS as mensagens cronologicamente
      // Motivo: Páginas podem ter sido carregadas fora de ordem
      return allMessages.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
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
    lastMessage,

    // Stats de realtime
    realtimeConnected: realtimeMessages.isConnected,
    realtimeTotalEvents: realtimeMessages.totalEvents
  };
};