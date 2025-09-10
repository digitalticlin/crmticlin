/**
 * 🚀 HOOK WHATSAPP MENSAGENS - REACT QUERY V2.0 CACHE BUSTER
 * 
 * RESPONSABILIDADES:
 * ✅ Exibir mensagens com React Query
 * ✅ Query keys isoladas (chat-messages)
 * ✅ Cache automático e otimizado  
 * ✅ Carregamento simples (30 mensagens iniciais)
 * ✅ Invalidação inteligente
 * 
 * VERSION: 2.0 - CACHE BUSTER ATIVO
 */

import { useCallback, useRef, useMemo, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Message, Contact } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { chatMessagesQueryKeys } from '@/hooks/chat/queryKeys';
import { useUserRole } from '@/hooks/useUserRole';

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

const MESSAGES_PER_PAGE = 30; // PRIMEIRA CARGA: 30 mensagens
const MESSAGE_REFETCH_INTERVAL = 5000; // Refetch apenas a cada 5 segundos, não contínuo

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
  return {
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
};

// Função para buscar mensagens (simplificada)
const fetchMessages = async (
  userId: string,
  contactId: string,
  activeInstanceId?: string | null,
  userRole?: 'admin' | 'operational',
  createdByUserId?: string
) => {
  console.log('[WhatsApp Messages RQ] 🚀🚀🚀 VERSÃO 2.0 CACHE BUSTER - Buscando mensagens via React Query:', {
    userId,
    contactId,
    activeInstanceId,
    userRole,
    createdByUserId,
    version: 'V2.0_CACHE_BUSTER',
    timestamp: new Date().toISOString()
  });
  
  // CACHE BUSTER: Log único para verificar se nova versão está ativa
  console.warn('🔥 CACHE BUSTER ATIVO - VERSÃO 2.0 DO HOOK MENSAGENS CARREGADA! 🔥');

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
    .eq('lead_id', contactId);
  
  // MULTITENANT: Usar created_by_user_id correto baseado no role
  if (userRole === 'admin') {
    // Admin vê mensagens onde created_by_user_id = seu próprio ID
    query = query.eq('created_by_user_id', userId);
  } else if (userRole === 'operational' && createdByUserId) {
    // Operacional vê mensagens do admin ao qual pertence
    query = query.eq('created_by_user_id', createdByUserId);
  } else {
    // Fallback seguro
    query = query.eq('created_by_user_id', userId);
  }
  
  // Adicionar filtro de instância apenas se disponível
  if (activeInstanceId) {
    query = query.eq('whatsapp_number_id', activeInstanceId);
  }
  
  const { data, error, count } = await query
    .order('created_at', { ascending: false }) // Mais recentes primeiro
    .range(0, MESSAGES_PER_PAGE - 1); // Primeiros 30

  if (error) throw error;

  const fetchedMessages = (data || []).map(convertMessage);
  
  // Reverter ordem para exibição cronológica (antigas → recentes)
  const orderedMessages = fetchedMessages.reverse();
  
  console.log('[WhatsApp Messages RQ] ✅ Mensagens carregadas COM ORDENAÇÃO CRONOLÓGICA:', {
    totalCount: count,
    loadedCount: orderedMessages.length,
    firstMessage: {
      text: orderedMessages[0]?.text?.substring(0, 30),
      timestamp: orderedMessages[0]?.timestamp
    },
    lastMessage: {
      text: orderedMessages[orderedMessages.length - 1]?.text?.substring(0, 30),
      timestamp: orderedMessages[orderedMessages.length - 1]?.timestamp
    },
    orderingType: 'CRONOLÓGICA: Mensagens antigas → mensagens recentes'
  });
  
  return {
    messages: orderedMessages,
    total: count || 0,
    hasMore: (fetchedMessages.length === MESSAGES_PER_PAGE) && (count || 0) > MESSAGES_PER_PAGE
  };
};

export const useWhatsAppMessages = ({
  selectedContact,
  activeInstance
}: UseWhatsAppMessagesParams): UseWhatsAppMessagesReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { role } = useUserRole();
  
  // Estado para armazenar created_by_user_id
  const [createdByUserId, setCreatedByUserId] = useState<string | null>(null);
  
  // Buscar created_by_user_id do perfil se for operacional
  useEffect(() => {
    const fetchCreatedByUserId = async () => {
      if (!user?.id || role !== 'operational') {
        setCreatedByUserId(null);
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_by_user_id')
        .eq('id', user.id)
        .single();
      
      if (profile?.created_by_user_id) {
        console.log('[WhatsApp Messages] 👤 Operacional - created_by_user_id:', profile.created_by_user_id);
        setCreatedByUserId(profile.created_by_user_id);
      }
    };
    
    fetchCreatedByUserId();
  }, [user?.id, role]);
  
  // Ref para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Controle de mensagens processadas (real-time)
  const sentMessageIds = useRef<Set<string>>(new Set());
  const lastMessageTimestamp = useRef<string | null>(null);

  // Query para mensagens (ANTI-LOOP com controles rígidos)
  const {
    data: queryData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: chatMessagesQueryKeys.byContact(selectedContact?.id || ''),
    queryFn: () => {
      if (!user?.id || !selectedContact?.id) {
        throw new Error('User ID and Contact ID required');
      }
      return fetchMessages(
        user.id, 
        selectedContact.id, 
        activeInstance?.id,
        role || 'operational',
        createdByUserId || undefined
      );
    },
    enabled: !!user?.id && !!selectedContact?.id,
    staleTime: 2 * 60 * 1000, // 2 minutos - AUMENTADO para evitar loops
    gcTime: 10 * 60 * 1000, // 10 minutos - AUMENTADO para cache estável
    refetchOnWindowFocus: false, // DESABILITADO - evita refetch desnecessário
    refetchOnMount: true, // Apenas na primeira montagem
    refetchInterval: false, // DESABILITADO - sem polling automático
    retry: 1, // Máximo 1 retry para evitar loops
  });

  console.log('[WhatsApp Messages RQ] 📊 Hook state:', {
    isLoading,
    hasData: !!queryData,
    messagesCount: queryData?.messages?.length || 0,
    selectedContactId: selectedContact?.id
  });

  // Dados extraídos
  const messages = queryData?.messages || [];
  const hasMoreMessages = queryData?.hasMore || false;

  // Função para carregar mais mensagens antigas (placeholder)
  const loadMoreMessages = useCallback(async () => {
    console.log('[WhatsApp Messages RQ] 📖 Load more messages (placeholder)');
    // TODO: Implementar paginação se necessário
  }, []);

  // Função para refresh
  const refreshMessages = useCallback(() => {
    console.log('[WhatsApp Messages RQ] 🔄 Refresh via React Query invalidation');
    if (selectedContact?.id) {
      queryClient.invalidateQueries({
        queryKey: chatMessagesQueryKeys.byContact(selectedContact.id)
      });
    }
  }, [queryClient, selectedContact?.id]);

  // Função para adicionar mensagem (real-time)
  const addMessage = useCallback((message: Message) => {
    console.log('[WhatsApp Messages RQ] 🎯 addMessage via React Query:', {
      messageId: message.id,
      fromMe: message.fromMe,
      text: message.text.substring(0, 30)
    });

    if (!selectedContact?.id) {
      console.warn('[WhatsApp Messages RQ] ❌ Sem contato selecionado');
      return;
    }

    // Verificar duplicação
    if (sentMessageIds.current.has(message.id)) {
      console.log('[WhatsApp Messages RQ] 🚫 Mensagem já existe:', message.id);
      return;
    }

    // Verificar timestamp
    if (lastMessageTimestamp.current && message.timestamp <= lastMessageTimestamp.current) {
      console.log('[WhatsApp Messages RQ] 🚫 Mensagem antiga ignorada');
      return;
    }

    // Adicionar aos processados
    sentMessageIds.current.add(message.id);
    lastMessageTimestamp.current = message.timestamp;

    // Atualizar cache do React Query
    queryClient.setQueryData(
      chatMessagesQueryKeys.byContact(selectedContact.id),
      (oldData: any) => {
        if (!oldData?.messages) return oldData;

        // Verificar se mensagem já existe
        const messageExists = oldData.messages.some((msg: Message) => msg.id === message.id);
        
        if (messageExists) {
          console.log('[WhatsApp Messages RQ] ⚠️ Mensagem já existe no cache');
          return oldData;
        }

        // Adicionar mensagem ao final (mais recente)
        const messages = [...oldData.messages, message];

        console.log('[WhatsApp Messages RQ] ✅ Mensagem adicionada ao cache');
        return { ...oldData, messages, total: oldData.total + 1 };
      }
    );
  }, [queryClient, selectedContact?.id]);

  // Função para atualizar mensagem (real-time)
  const updateMessage = useCallback((updatedMessage: Message) => {
    if (!selectedContact?.id) return;

    queryClient.setQueryData(
      chatMessagesQueryKeys.byContact(selectedContact.id),
      (oldData: any) => {
        if (!oldData?.messages) return oldData;

        const messages = oldData.messages.map((msg: Message) => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        );

        // Se mensagem não foi encontrada, adicionar como nova
        const messageFound = messages.some((msg: Message) => msg.id === updatedMessage.id);

        if (!messageFound) {
          console.log('[WhatsApp Messages RQ] ➕ Mensagem não encontrada, adicionando');
          messages.push(updatedMessage);
        }

        return { ...oldData, messages };
      }
    );
  }, [queryClient, selectedContact?.id]);

  return {
    messages,
    isLoading,
    isLoadingMore: false, // Simplificado por enquanto
    hasMoreMessages,
    loadMoreMessages,
    refreshMessages,
    addMessage,
    updateMessage,
    messagesEndRef
  };
};