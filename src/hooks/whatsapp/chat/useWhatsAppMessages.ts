/**
 * 🎯 HOOK WHATSAPP MENSAGENS - MIGRADO PARA REACT QUERY
 * 
 * RESPONSABILIDADES:
 * ✅ Exibir mensagens com React Query
 * ✅ Query keys isoladas (chat-messages)
 * ✅ Cache automático e otimizado
 * ✅ Paginação infinita para mensagens antigas
 * ✅ Invalidação inteligente
 */

import { useCallback, useRef, useMemo } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Message, Contact } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { chatMessagesQueryKeys } from '@/hooks/chat/queryKeys';

// Tipo simplificado para o hook isolado
interface WhatsAppInstance {
  id: string;
  instance_name: string;
  connection_status: string;
}

interface UseWhatsAppMessagesParams {
  selectedContact: Contact | null;
  activeInstance: WhatsAppInstance | null;
}

interface UseWhatsAppMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  loadMoreMessages: () => Promise<void>;
  refreshMessages: () => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MESSAGES_PER_PAGE = 20;

// Helper para normalizar mediaType
const normalizeMediaType = (mediaType?: string): "text" | "image" | "video" | "audio" | "document" => {
  if (!mediaType) return 'text';
  
  const normalizedType = mediaType.toLowerCase();
  if (normalizedType.includes('image')) return 'image';
  if (normalizedType.includes('video')) return 'video';
  if (normalizedType.includes('audio')) return 'audio';
  if (normalizedType.includes('document')) return 'document';
  
  return 'text';
};

// Função para converter dados do banco para Message
const convertMessage = (messageData: any): Message => {
  const message: Message = {
    id: messageData.id,
    text: messageData.text || '',
    fromMe: messageData.from_me || false,
    timestamp: messageData.created_at || new Date().toISOString(),
    status: messageData.status || 'sent',
    mediaType: normalizeMediaType(messageData.media_type),
    mediaUrl: messageData.media_url || undefined,
    sender: messageData.from_me ? 'user' : 'contact',
    time: new Date(messageData.created_at || Date.now()).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    isIncoming: !messageData.from_me,
    media_cache: messageData.media_cache || null
  };

  return message;
};

// Função para buscar mensagens
const fetchMessages = async (
  userId: string,
  contactId: string,
  activeInstanceId?: string | null,
  pageParam = 0
) => {
  console.log('[WhatsApp Messages] 🚀 Buscando mensagens via React Query:', {
    userId,
    contactId,
    activeInstanceId,
    offset: pageParam
  });

  // Query com filtro obrigatório
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
    .eq('lead_id', contactId)
    .eq('created_by_user_id', userId);
  
  // Adicionar filtro de instância apenas se disponível
  if (activeInstanceId) {
    query = query.eq('whatsapp_number_id', activeInstanceId);
  }
  
  const { data, error, count } = await query
    .order('created_at', { ascending: false }) // Ordem: mais recentes primeiro para paginação
    .range(pageParam * MESSAGES_PER_PAGE, (pageParam + 1) * MESSAGES_PER_PAGE - 1);

  if (error) throw error;

  const fetchedMessages = (data || []).map(convertMessage);
  
  // Reverter ordem para exibição cronológica (antigas → recentes)
  const orderedMessages = fetchedMessages.reverse();
  
  return {
    messages: orderedMessages,
    nextCursor: fetchedMessages.length === MESSAGES_PER_PAGE ? pageParam + 1 : undefined,
    hasMore: fetchedMessages.length === MESSAGES_PER_PAGE,
    total: count || 0
  };
};

export const useWhatsAppMessages = ({
  selectedContact,
  activeInstance
}: UseWhatsAppMessagesParams): UseWhatsAppMessagesReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Ref para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Controle de mensagens processadas (real-time)
  const sentMessageIds = useRef<Set<string>>(new Set());
  const lastMessageTimestamp = useRef<string | null>(null);

  // Query para mensagens com paginação infinita
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: chatMessagesQueryKeys.byContact(selectedContact?.id || ''),
    queryFn: ({ pageParam = 0 }) => {
      if (!user?.id || !selectedContact?.id) {
        throw new Error('User ID and Contact ID required');
      }
      return fetchMessages(user.id, selectedContact.id, activeInstance?.id, pageParam);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!user?.id && !!selectedContact?.id,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });

  // Combinar todas as páginas de mensagens (mantendo ordem cronológica)
  const messages = useMemo(() => {
    if (!data?.pages) return [];
    
    // Para paginação infinita, páginas mais antigas vão ANTES das existentes
    const allMessages = data.pages.flatMap(page => page.messages);
    
    // Como buscamos em ordem reversa (mais recentes primeiro) e revertemos cada página,
    // precisamos reverter a ordem das páginas para manter cronologia correta
    const pagesInOrder = [...data.pages].reverse();
    const messagesInChronologicalOrder = pagesInOrder.flatMap(page => page.messages);
    
    console.log('[WhatsApp Messages] 📋 Mensagens organizadas:', {
      totalPages: data.pages.length,
      totalMessages: messagesInChronologicalOrder.length,
      firstMessage: messagesInChronologicalOrder[0]?.text?.substring(0, 30),
      lastMessage: messagesInChronologicalOrder[messagesInChronologicalOrder.length - 1]?.text?.substring(0, 30)
    });
    
    return messagesInChronologicalOrder;
  }, [data?.pages]);

  // Função para carregar mais mensagens antigas
  const loadMoreMessages = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      console.log('[WhatsApp Messages] 📖 Carregando mais mensagens...');
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Função para refresh
  const refreshMessages = useCallback(() => {
    console.log('[WhatsApp Messages] 🔄 Refresh via React Query invalidation');
    if (selectedContact?.id) {
      queryClient.invalidateQueries({
        queryKey: chatMessagesQueryKeys.byContact(selectedContact.id)
      });
    }
  }, [queryClient, selectedContact?.id]);

  // Função para adicionar mensagem (real-time)
  const addMessage = useCallback((message: Message) => {
    console.log('[WhatsApp Messages] 🎯 addMessage via React Query:', {
      messageId: message.id,
      fromMe: message.fromMe,
      text: message.text.substring(0, 30),
      timestamp: message.timestamp,
      selectedContactId: selectedContact?.id
    });

    if (!selectedContact?.id) {
      console.warn('[WhatsApp Messages] ❌ Sem contato selecionado');
      return;
    }

    // Verificar duplicação
    if (sentMessageIds.current.has(message.id)) {
      console.log('[WhatsApp Messages] 🚫 Mensagem já existe:', message.id);
      return;
    }

    // Verificar timestamp
    if (lastMessageTimestamp.current && message.timestamp <= lastMessageTimestamp.current) {
      console.log('[WhatsApp Messages] 🚫 Mensagem antiga ignorada:', {
        messageId: message.id,
        messageTimestamp: message.timestamp,
        lastTimestamp: lastMessageTimestamp.current
      });
      return;
    }

    // Adicionar aos processados
    sentMessageIds.current.add(message.id);
    lastMessageTimestamp.current = message.timestamp;

    // Atualizar cache do React Query
    queryClient.setQueryData(
      chatMessagesQueryKeys.byContact(selectedContact.id),
      (oldData: any) => {
        if (!oldData?.pages?.[oldData.pages.length - 1]) return oldData;

        const newPages = [...oldData.pages];
        const lastPageIndex = newPages.length - 1;
        
        // Verificar se mensagem já existe
        const messageExists = newPages.some((page: any) => 
          page.messages.some((msg: Message) => msg.id === message.id)
        );
        
        if (messageExists) {
          console.log('[WhatsApp Messages] ⚠️ Mensagem já existe no cache, ignorando duplicata');
          return oldData;
        }

        // Adicionar mensagem ao final da última página (mais recente)
        newPages[lastPageIndex] = {
          ...newPages[lastPageIndex],
          messages: [...newPages[lastPageIndex].messages, message]
        };

        console.log('[WhatsApp Messages] ✅ Mensagem adicionada ao cache React Query');
        return { ...oldData, pages: newPages };
      }
    );
  }, [queryClient, selectedContact?.id]);

  // Função para atualizar mensagem (real-time)
  const updateMessage = useCallback((updatedMessage: Message) => {
    if (!selectedContact?.id) return;

    queryClient.setQueryData(
      chatMessagesQueryKeys.byContact(selectedContact.id),
      (oldData: any) => {
        if (!oldData?.pages) return oldData;

        const newPages = oldData.pages.map((page: any) => ({
          ...page,
          messages: page.messages.map((msg: Message) => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          )
        }));

        // Se mensagem não foi encontrada, adicionar como nova
        const messageFound = newPages.some((page: any) =>
          page.messages.some((msg: Message) => msg.id === updatedMessage.id)
        );

        if (!messageFound) {
          console.log('[WhatsApp Messages] ➕ Mensagem não encontrada, adicionando como nova');
          const lastPageIndex = newPages.length - 1;
          if (newPages[lastPageIndex]) {
            newPages[lastPageIndex] = {
              ...newPages[lastPageIndex],
              messages: [...newPages[lastPageIndex].messages, updatedMessage]
            };
          }
        }

        return { ...oldData, pages: newPages };
      }
    );
  }, [queryClient, selectedContact?.id]);

  return {
    messages,
    isLoading,
    isLoadingMore: isFetchingNextPage,
    hasMoreMessages: hasNextPage || false,
    loadMoreMessages,
    refreshMessages,
    addMessage,
    updateMessage,
    messagesEndRef
  };
};