
/**
 * 🎯 HOOK DE MENSAGENS OTIMIZADO - CORRIGIDO RERENDERS
 * 
 * CORREÇÕES IMPLEMENTADAS:
 * ✅ Carregamento APENAS quando contato é selecionado
 * ✅ useCallback otimizados com dependências corretas
 * ✅ Cache inteligente sem refreshes automáticos
 * ✅ Eliminação de rerenders excessivos
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  
  // 🚀 CORREÇÃO: Cache estável para evitar rerenders
  const messagesCache = useRef<Map<string, Message[]>>(new Map());
  const sentMessageIds = useRef<Set<string>>(new Set());
  const lastMessageTimestamp = useRef<string | null>(null);
  const pendingOptimisticIds = useRef<Set<string>>(new Set());
  const lastFetchedContact = useRef<string | null>(null);

  // 🚀 CORREÇÃO: Memoizar conversão para evitar recriação
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

  // 🚀 CORREÇÃO: Chave de cache estável
  const cacheKey = useMemo(() => {
    return selectedContact && activeInstance 
      ? `${selectedContact.id}-${activeInstance.id}` 
      : null;
  }, [selectedContact?.id, activeInstance?.id]);

  // 🚀 CORREÇÃO: fetchMessages otimizado com cache
  const fetchMessages = useCallback(async (page = 0, append = false) => {
    if (!selectedContact || !activeInstance || !user?.id || !cacheKey) {
      setMessages([]);
      setHasMoreMessages(false);
      return;
    }

    // Verificar cache apenas para primeira página
    if (page === 0 && !append && messagesCache.current.has(cacheKey)) {
      console.log(`[Messages] 📋 Usando cache para: ${selectedContact.name}`);
      const cachedMessages = messagesCache.current.get(cacheKey) || [];
      setMessages(cachedMessages);
      setHasMoreMessages(cachedMessages.length === MESSAGES_PER_PAGE);
      return;
    }

    try {
      if (page === 0) {
        setIsLoadingMessages(true);
        if (!append) {
          setMessages([]);
          sentMessageIds.current.clear();
          pendingOptimisticIds.current.clear();
          lastMessageTimestamp.current = null;
        }
      } else {
        setIsLoadingMore(true);
      }

      console.log(`[Messages] 🔍 Buscando mensagens página ${page} para: ${selectedContact.name}`);

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
      const orderedMessages = newMessages.reverse();
      
      console.log(`[Messages] ✅ ${newMessages.length} mensagens carregadas`);

      if (append) {
        setMessages(prev => [...orderedMessages, ...prev]);
      } else {
        setMessages(orderedMessages);
        // Salvar no cache apenas primeira página
        if (page === 0) {
          messagesCache.current.set(cacheKey, orderedMessages);
        }
      }

      setHasMoreMessages(newMessages.length === MESSAGES_PER_PAGE);
      setCurrentPage(page);

    } catch (error) {
      console.error('[Messages] ❌ Erro ao buscar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoadingMessages(false);
      setIsLoadingMore(false);
    }
  }, [selectedContact, activeInstance, user?.id, cacheKey, convertMessage]);

  // 🚀 CORREÇÃO: loadMoreMessages otimizado
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMore) return;
    await fetchMessages(currentPage + 1, true);
  }, [hasMoreMessages, isLoadingMore, currentPage, fetchMessages]);

  // 🚀 CORREÇÃO: refreshMessages limpa cache
  const refreshMessages = useCallback(() => {
    if (cacheKey) {
      console.log('[Messages] 🔄 Refresh manual - limpando cache');
      messagesCache.current.delete(cacheKey);
    }
    setCurrentPage(0);
    fetchMessages(0, false);
  }, [fetchMessages, cacheKey]);

  // 🚀 CORREÇÃO: addOptimisticMessage otimizado
  const addOptimisticMessage = useCallback((message: Message) => {
    if (sentMessageIds.current.has(message.id)) {
      console.log(`[Messages] 🚫 Mensagem já existe: ${message.id}`);
      return;
    }

    if (lastMessageTimestamp.current && message.timestamp <= lastMessageTimestamp.current) {
      console.log(`[Messages] 🚫 Mensagem antiga ignorada: ${message.id}`);
      return;
    }

    setMessages(prev => {
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) return prev;
      
      console.log(`[Messages] ➕ Adicionando nova mensagem: ${message.id}`);
      
      sentMessageIds.current.add(message.id);
      lastMessageTimestamp.current = message.timestamp;
      
      const newMessages = [...prev, message];
      
      // Atualizar cache se é a conversa atual
      if (cacheKey) {
        messagesCache.current.set(cacheKey, newMessages);
      }
      
      return newMessages;
    });
  }, [cacheKey]);

  // 🚀 CORREÇÃO: updateMessage otimizado
  const updateMessage = useCallback((updatedMessage: Message) => {
    setMessages(prev => {
      const messageIndex = prev.findIndex(msg => msg.id === updatedMessage.id);
      
      if (messageIndex >= 0) {
        const updated = [...prev];
        updated[messageIndex] = updatedMessage;
        
        // Atualizar cache
        if (cacheKey) {
          messagesCache.current.set(cacheKey, updated);
        }
        
        return updated;
      } else {
        console.log(`[Messages] ➕ Mensagem não encontrada, adicionando: ${updatedMessage.id}`);
        sentMessageIds.current.add(updatedMessage.id);
        
        const newMessages = [...prev, updatedMessage];
        
        if (cacheKey) {
          messagesCache.current.set(cacheKey, newMessages);
        }
        
        return newMessages;
      }
    });
  }, [cacheKey]);

  // ✅ CORREÇÃO: Substituir mensagem otimista
  const replaceOptimisticMessage = useCallback((tempId: string, realMessage: Message) => {
    console.log(`[Messages] 🔄 Substituindo: ${tempId} → ${realMessage.id}`);
    
    setMessages(prev => {
      const updated = prev.map(msg => 
        msg.id === tempId ? { ...realMessage, status: 'sent' as const } : msg
      );
      
      pendingOptimisticIds.current.delete(tempId);
      sentMessageIds.current.add(realMessage.id);
      
      // Atualizar cache
      if (cacheKey) {
        messagesCache.current.set(cacheKey, updated);
      }
      
      return updated;
    });
  }, [cacheKey]);

  // Remover mensagem otimista
  const removeOptimisticMessage = useCallback((tempId: string) => {
    console.log(`[Messages] ❌ Removendo mensagem otimista: ${tempId}`);
    
    setMessages(prev => {
      const filtered = prev.filter(msg => msg.id !== tempId);
      pendingOptimisticIds.current.delete(tempId);
      
      // Atualizar cache
      if (cacheKey) {
        messagesCache.current.set(cacheKey, filtered);
      }
      
      return filtered;
    });
  }, [cacheKey]);

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

      addOptimisticMessage(optimisticMessage);

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

        replaceOptimisticMessage(tempId, realMessage);
        toast.success('Mensagem enviada!');
        return true;
      } else {
        removeOptimisticMessage(tempId);
        toast.error(result.error || 'Erro ao enviar mensagem');
        return false;
      }

    } catch (error: any) {
      console.error('[Messages] ❌ Erro crítico:', error);
      removeOptimisticMessage(tempId);
      toast.error(`Erro: ${error.message}`);
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedContact, activeInstance, user, addOptimisticMessage, replaceOptimisticMessage, removeOptimisticMessage]);

  // 🚀 CORREÇÃO PRINCIPAL: Carregar apenas quando contato MUDA
  useEffect(() => {
    if (selectedContact?.id && activeInstance?.id && user?.id) {
      // Verificar se realmente mudou o contato
      if (lastFetchedContact.current !== selectedContact.id) {
        console.log(`[Messages] 🎯 Mudança de contato: ${lastFetchedContact.current} → ${selectedContact.id}`);
        lastFetchedContact.current = selectedContact.id;
        setCurrentPage(0);
        fetchMessages(0, false);
      } else {
        console.log(`[Messages] ⏭️ Mesmo contato, sem recarregamento: ${selectedContact.name}`);
      }
    } else {
      console.log('[Messages] 🧹 Limpando mensagens - sem contato/instância');
      setMessages([]);
      setHasMoreMessages(false);
      lastFetchedContact.current = null;
    }
  }, [selectedContact?.id, activeInstance?.id, user?.id, fetchMessages]);

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
