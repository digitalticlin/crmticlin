
/**
 * 🎯 HOOK DE MENSAGENS OTIMIZADO - SEM REFRESHES DESNECESSÁRIOS
 * 
 * CORREÇÕES IMPLEMENTADAS:
 * ✅ Paginação de 20 mensagens
 * ✅ Cache inteligente sem refreshes automáticos
 * ✅ Detecção de mensagens realmente novas
 * ✅ Substituição instantânea sem duplicação
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MessagingService } from '@/modules/whatsapp/messaging/services/messagingService';

interface UseWhatsAppChatMessagesProps {
  selectedContact: Contact | null;
  activeInstance: WhatsAppWebInstance | null;
}

interface UseWhatsAppChatMessagesReturn {
  messages: Message[];
  isLoadingMessages: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  isSendingMessage: boolean;
  sendMessage: (text: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
  loadMoreMessages: () => Promise<void>;
  refreshMessages: () => void;
  addOptimisticMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
}

const MESSAGES_PER_PAGE = 20; // 20 mensagens por página

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

export const useWhatsAppChatMessages = ({
  selectedContact,
  activeInstance
}: UseWhatsAppChatMessagesProps): UseWhatsAppChatMessagesReturn => {
  const { user } = useAuth();
  
  // Estados principais
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  // 🚀 CORREÇÃO: Controle de mensagens sem duplicação
  const sentMessageIds = useRef<Set<string>>(new Set());
  const messagesCache = useRef<Map<string, Message[]>>(new Map());
  const lastMessageTimestamp = useRef<string | null>(null);
  const pendingOptimisticIds = useRef<Set<string>>(new Set());

  // 🚀 CORREÇÃO: Função para converter mensagem com timestamp tracking
  const convertMessage = useCallback((messageData: any): Message => {
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

    // Atualizar último timestamp
    if (!lastMessageTimestamp.current || message.timestamp > lastMessageTimestamp.current) {
      lastMessageTimestamp.current = message.timestamp;
    }

    return message;
  }, []);

  // 🚀 CORREÇÃO: Query otimizada sem cache excessivo
  const fetchMessages = useCallback(async (page = 0, append = false) => {
    if (!selectedContact || !activeInstance || !user?.id) {
      setMessages([]);
      setHasMoreMessages(false);
      return;
    }

    try {
      if (page === 0) {
        setIsLoadingMessages(true);
        setMessages([]);
        sentMessageIds.current.clear();
        pendingOptimisticIds.current.clear();
        lastMessageTimestamp.current = null;
      } else {
        setIsLoadingMore(true);
      }

      console.log(`[useWhatsAppChatMessages] 🔍 Buscando mensagens página ${page}`);

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          media_cache!left (
            id,
            base64_data,
            original_url,
            cached_url,
            file_size,
            media_type
          )
        `)
        .eq('lead_id', selectedContact.id)
        .eq('whatsapp_number_id', activeInstance.id)
        .eq('created_by_user_id', user.id)
        .order('created_at', { ascending: false })
        .range(page * MESSAGES_PER_PAGE, (page + 1) * MESSAGES_PER_PAGE - 1);

      if (error) throw error;

      const newMessages = (data || []).map(convertMessage);
      
      console.log(`[useWhatsAppChatMessages] ✅ ${newMessages.length} mensagens carregadas`);

      if (append) {
        setMessages(prev => [...newMessages.reverse(), ...prev]);
      } else {
        setMessages(newMessages.reverse());
      }

      setHasMoreMessages(newMessages.length === MESSAGES_PER_PAGE);
      setCurrentPage(page);

    } catch (error) {
      console.error('[useWhatsAppChatMessages] ❌ Erro ao buscar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoadingMessages(false);
      setIsLoadingMore(false);
    }
  }, [selectedContact, activeInstance, user?.id, convertMessage]);

  // Carregar mais mensagens
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMore) {
      return;
    }
    
    await fetchMessages(currentPage + 1, true);
  }, [hasMoreMessages, isLoadingMore, currentPage, fetchMessages]);

  // 🚀 CORREÇÃO: Refresh apenas manual
  const refreshMessages = useCallback(() => {
    console.log('[useWhatsAppChatMessages] 🔄 Refresh manual das mensagens');
    messagesCache.current.clear();
    setCurrentPage(0);
    fetchMessages(0, false);
  }, [fetchMessages]);

  // 🚀 CORREÇÃO: Adicionar mensagem apenas se realmente nova
  const addOptimisticMessage = useCallback((message: Message) => {
    // Evitar duplicação rigorosa
    if (sentMessageIds.current.has(message.id)) {
      console.log(`[useWhatsAppChatMessages] 🚫 Mensagem já existe: ${message.id}`);
      return;
    }

    // Verificar se é mensagem realmente nova por timestamp
    if (lastMessageTimestamp.current && message.timestamp <= lastMessageTimestamp.current) {
      console.log(`[useWhatsAppChatMessages] 🚫 Mensagem antiga ignorada: ${message.id}`);
      return;
    }

    setMessages(prev => {
      // Double check na lista atual
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) {
        return prev;
      }
      
      console.log(`[useWhatsAppChatMessages] ➕ Adicionando nova mensagem: ${message.id}`);
      
      // Marcar como existente e atualizar timestamp
      sentMessageIds.current.add(message.id);
      lastMessageTimestamp.current = message.timestamp;
      
      return [...prev, message];
    });
  }, []);

  // ✅ CORREÇÃO: Atualizar mensagem sem duplicar
  const updateMessage = useCallback((updatedMessage: Message) => {
    setMessages(prev => {
      const messageIndex = prev.findIndex(msg => msg.id === updatedMessage.id);
      
      if (messageIndex >= 0) {
        // Atualizar mensagem existente
        const updated = [...prev];
        updated[messageIndex] = updatedMessage;
        return updated;
      } else {
        // Se não encontrou, pode ser uma nova mensagem
        console.log(`[useWhatsAppChatMessages] ➕ Mensagem não encontrada, adicionando: ${updatedMessage.id}`);
        sentMessageIds.current.add(updatedMessage.id);
        return [...prev, updatedMessage];
      }
    });
  }, []);

  // ✅ CORREÇÃO: Substituir mensagem otimista instantaneamente
  const replaceOptimisticMessage = useCallback((tempId: string, realMessage: Message) => {
    console.log(`[useWhatsAppChatMessages] 🔄 Substituindo: ${tempId} → ${realMessage.id}`);
    
    setMessages(prev => {
      const updated = prev.map(msg => 
        msg.id === tempId ? { ...realMessage, status: 'sent' as const } : msg
      );
      
      pendingOptimisticIds.current.delete(tempId);
      sentMessageIds.current.add(realMessage.id);
      
      return updated;
    });
  }, []);

  // Remover mensagem otimista em erro
  const removeOptimisticMessage = useCallback((tempId: string) => {
    console.log(`[useWhatsAppChatMessages] ❌ Removendo mensagem otimista: ${tempId}`);
    
    setMessages(prev => prev.filter(msg => msg.id !== tempId));
    pendingOptimisticIds.current.delete(tempId);
  }, []);

  // ✅ FUNÇÃO DE ENVIO otimizada
  const sendMessage = useCallback(async (text: string, mediaType?: string, mediaUrl?: string): Promise<boolean> => {
    if (!selectedContact || !activeInstance || !user) {
      toast.error('Dados necessários não disponíveis');
      return false;
    }

    if (!text.trim() && !mediaUrl) {
      toast.error('Mensagem não pode estar vazia');
      return false;
    }

    setIsSendingMessage(true);
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    pendingOptimisticIds.current.add(tempId);

    try {
      const finalMediaType = mediaType ? normalizeMediaType(mediaType) : 'text';
      
      // Mensagem otimista
      const optimisticMessage: Message = {
        id: tempId,
        text: text.trim(),
        fromMe: true,
        timestamp: new Date().toISOString(),
        status: 'sending' as const,
        mediaType: finalMediaType,
        mediaUrl,
        sender: 'user',
        time: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isIncoming: false,
        media_cache: null
      };

      // Adicionar mensagem otimista
      addOptimisticMessage(optimisticMessage);

      // Enviar via service
      const result = await MessagingService.sendMessage({
        instanceId: activeInstance.id,
        phone: selectedContact.phone,
        message: text.trim(),
        mediaType: finalMediaType,
        mediaUrl
      });

      if (result.success) {
        const realMessage: Message = {
          ...optimisticMessage,
          id: result.messageId || tempId,
          timestamp: result.timestamp || new Date().toISOString(),
          status: 'sent' as const
        };

        // Substituição instantânea
        replaceOptimisticMessage(tempId, realMessage);
        toast.success('Mensagem enviada!');
        return true;
      } else {
        removeOptimisticMessage(tempId);
        toast.error(result.error || 'Erro ao enviar mensagem');
        return false;
      }

    } catch (error: any) {
      console.error('[useWhatsAppChatMessages] ❌ Erro crítico:', error);
      removeOptimisticMessage(tempId);
      toast.error(`Erro: ${error.message}`);
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedContact, activeInstance, user, addOptimisticMessage, replaceOptimisticMessage, removeOptimisticMessage]);

  // 🚀 CORREÇÃO: Carregar mensagens apenas quando contato muda (sem auto-refresh)
  useEffect(() => {
    if (selectedContact && activeInstance) {
      fetchMessages(0, false);
    } else {
      setMessages([]);
      setHasMoreMessages(false);
    }
  }, [selectedContact?.id, activeInstance?.id]);

  return {
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    isSendingMessage,
    sendMessage,
    loadMoreMessages,
    refreshMessages,
    addOptimisticMessage,
    updateMessage
  };
};
