/**
 * 🎯 HOOK ISOLADO PARA MENSAGENS WHATSAPP
 * 
 * RESPONSABILIDADES:
 * ✅ Gerenciar mensagens da conversa ativa
 * ✅ Cache isolado por conversa
 * ✅ Envio de mensagens otimistas
 * ✅ Scroll automático corrigido
 * ✅ Ordem correta das mensagens (mais recentes embaixo)
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, Contact } from '@/types/chat';
// Tipo simplificado para o hook isolado (compatibilidade)
interface WhatsAppInstance {
  id: string;
  instance_name: string;
  connection_status: string;
}
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MessagingService } from '@/modules/whatsapp/messaging/services/messagingService';

interface UseWhatsAppMessagesParams {
  selectedContact: Contact | null;
  activeInstance: WhatsAppInstance | null;
}

interface UseWhatsAppMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  isSendingMessage: boolean;
  sendMessage: (text: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
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

export const useWhatsAppMessages = ({
  selectedContact,
  activeInstance
}: UseWhatsAppMessagesParams): UseWhatsAppMessagesReturn => {
  const { user } = useAuth();
  
  // Estados isolados da feature
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Cache isolado por conversa
  const cache = useRef<Map<string, {
    messages: Message[];
    timestamp: number;
    hasMore: boolean;
    page: number;
  }>>(new Map());
  
  // Controle de mensagens isolado
  const sentMessageIds = useRef<Set<string>>(new Set());
  const lastMessageTimestamp = useRef<string | null>(null);
  const pendingOptimisticIds = useRef<Set<string>>(new Set());
  const lastFetchedContact = useRef<string | null>(null);
  
  // Ref para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chave de cache isolada - CORRIGIDA para funcionar sem instância
  const cacheKey = useMemo(() => {
    return selectedContact 
      ? `${selectedContact.id}-${activeInstance?.id || 'no-instance'}` 
      : null;
  }, [selectedContact?.id, activeInstance?.id]);

  // Conversão de mensagem isolada
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

  // Buscar mensagens (isolado) - CORRIGIDO PARA FUNCIONAR SEM INSTÂNCIA
  const fetchMessages = useCallback(async (page = 0, append = false) => {
    console.log('[WhatsApp Messages] 🚀 HOOK EXECUTADO - fetchMessages:', {
      hasSelectedContact: !!selectedContact,
      hasActiveInstance: !!activeInstance,
      hasUserId: !!user?.id,
      selectedContactId: selectedContact?.id,
      selectedContactName: selectedContact?.name,
      activeInstanceId: activeInstance?.id,
      userId: user?.id,
      page,
      append
    });

    if (!selectedContact || !user?.id) {
      console.log('[WhatsApp Messages] ❌ Parâmetros obrigatórios ausentes:', {
        hasSelectedContact: !!selectedContact,
        hasUserId: !!user?.id
      });
      setMessages([]);
      setHasMoreMessages(false);
      return;
    }

    // CORREÇÃO: Permitir busca sem activeInstance se não houver instâncias configuradas
    if (!activeInstance) {
      console.log('[WhatsApp Messages] ⚠️ Sem instância ativa - buscando mensagens direto por lead_id');
    }

    // Verificar cache apenas para primeira página
    if (page === 0 && !append && cache.current.has(cacheKey)) {
      const cached = cache.current.get(cacheKey)!;
      console.log('[WhatsApp Messages] 💾 Usando cache isolado:', {
        contact: selectedContact.name,
        cachedMessages: cached.messages.length,
        cacheAge: Date.now() - cached.timestamp,
        hasMore: cached.hasMore
      });
      
      // ⚠️ DEBUG: Verificar se cache está corrompido
      if (cached.messages.length > MESSAGES_PER_PAGE) {
        console.warn('[WhatsApp Messages] 🚨 CACHE CORROMPIDO - mais que 20 mensagens:', cached.messages.length);
        cache.current.delete(cacheKey); // Limpar cache corrompido
      } else {
        setMessages(cached.messages);
        setHasMoreMessages(cached.hasMore);
        setCurrentPage(cached.page);
        return;
      }
    }

    try {
      if (page === 0) {
        setIsLoading(true);
        if (!append) {
          setMessages([]);
          sentMessageIds.current.clear();
          pendingOptimisticIds.current.clear();
          lastMessageTimestamp.current = null;
        }
      } else {
        setIsLoadingMore(true);
      }

      console.log('[WhatsApp Messages] 🔍 Buscando mensagens página:', page, 'para:', selectedContact.name, {
        leadId: selectedContact.id,
        instanceId: activeInstance?.id || 'sem-instancia',
        userId: user.id,
        contactName: selectedContact.name,
        instanceName: activeInstance?.instance_name || 'N/A'
      });

      // 🚀 CORREÇÃO: Query modificada para funcionar com/sem instância
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
        .eq('lead_id', selectedContact.id)
        .eq('created_by_user_id', user.id);
      
      // Adicionar filtro de instância apenas se disponível
      if (activeInstance?.id) {
        query = query.eq('whatsapp_number_id', activeInstance.id);
        console.log('[WhatsApp Messages] 🔍 Aplicando filtro de instância:', activeInstance.id);
      } else {
        console.log('[WhatsApp Messages] ⚠️ Buscando mensagens SEM filtro de instância');
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false }) // Mais recentes primeiro
        .range(page * MESSAGES_PER_PAGE, (page + 1) * MESSAGES_PER_PAGE - 1);

      if (error) throw error;

      const fetchedMessages = (data || []).map(convertMessage);
      
      // 🚀 PRE-POSITIONED: Manter ordem recentes→antigas para renderização otimizada
      const orderedMessages = fetchedMessages; // SEM reverse - já vem na ordem correta
      
      console.log('[WhatsApp Messages] ✅ Mensagens carregadas:', {
        count: orderedMessages.length,
        totalCount: count,
        page,
        contact: selectedContact.name,
        leadId: selectedContact.id,
        instanceId: activeInstance?.id || 'sem-instancia',
        userId: user.id,
        firstMessage: orderedMessages[0] ? {
          id: orderedMessages[0].id,
          text: orderedMessages[0].text.substring(0, 50),
          fromMe: orderedMessages[0].fromMe,
          timestamp: fetchedMessages[0].timestamp
        } : null
      });

      if (append) {
        // 🚀 CORREÇÃO: Para lazy loading, mensagens antigas vão ANTES das atuais
        setMessages(prev => [...orderedMessages, ...prev]);
      } else {
        // 🚀 CORREÇÃO: Para primeira carga, usar mensagens ordenadas (antigas→recentes)
        setMessages(orderedMessages);
        
        // Salvar no cache isolado
        if (page === 0 && cacheKey) {
          cache.current.set(cacheKey, {
            messages: orderedMessages,
            timestamp: Date.now(),
            hasMore: orderedMessages.length === MESSAGES_PER_PAGE,
            page: page
          });
        }
      }

      setHasMoreMessages(orderedMessages.length === MESSAGES_PER_PAGE);
      setCurrentPage(page);

      // 🚀 PRE-POSITIONED: Sem posicionamento aqui - será feito pelo useLayoutEffect do componente
      // O posicionamento agora acontece ANTES do paint, eliminando scroll visível

    } catch (error: any) {
      console.error('[WhatsApp Messages] ❌ Erro ao buscar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedContact, activeInstance, user?.id, cacheKey, convertMessage]);

  // Carregar mais mensagens antigas
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMore) return;
    await fetchMessages(currentPage + 1, true);
  }, [hasMoreMessages, isLoadingMore, currentPage, fetchMessages]);

  // Refresh mensagens
  const refreshMessages = useCallback(() => {
    if (cacheKey) {
      console.log('[WhatsApp Messages] 🔄 Refresh mensagens isolado');
      cache.current.delete(cacheKey);
    }
    setCurrentPage(0);
    fetchMessages(0, false);
  }, [fetchMessages, cacheKey]);

  // 🚀 PRE-POSITIONED: scrollToBottom removido - posicionamento agora é no useLayoutEffect do componente

  // Adicionar mensagem (isolado)
  const addMessage = useCallback((message: Message) => {
    if (sentMessageIds.current.has(message.id)) {
      console.log('[WhatsApp Messages] 🚫 Mensagem já existe:', message.id);
      return;
    }

    if (lastMessageTimestamp.current && message.timestamp <= lastMessageTimestamp.current) {
      console.log('[WhatsApp Messages] 🚫 Mensagem antiga ignorada:', message.id);
      return;
    }

    setMessages(prev => {
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) return prev;
      
      console.log('[WhatsApp Messages] ➕ Adicionando nova mensagem:', message.id);
      
      sentMessageIds.current.add(message.id);
      lastMessageTimestamp.current = message.timestamp;
      
      // 🚀 CORREÇÃO: Nova mensagem sempre vai no FINAL (mais recente)
      const newMessages = [...prev, message];
      
      // Atualizar cache isolado
      if (cacheKey) {
        cache.current.set(cacheKey, {
          messages: newMessages,
          timestamp: Date.now(),
          hasMore: cache.current.get(cacheKey)?.hasMore || false,
          page: cache.current.get(cacheKey)?.page || 0
        });
      }
      
      return newMessages;
    });

    // 🚀 PRE-POSITIONED: Mensagens novas também serão posicionadas pelo useLayoutEffect
  }, [cacheKey]);

  // Atualizar mensagem (isolado)
  const updateMessage = useCallback((updatedMessage: Message) => {
    setMessages(prev => {
      const messageIndex = prev.findIndex(msg => msg.id === updatedMessage.id);
      
      if (messageIndex >= 0) {
        const updated = [...prev];
        updated[messageIndex] = updatedMessage;
        
        // Atualizar cache isolado
        if (cacheKey) {
          cache.current.set(cacheKey, {
            messages: updated,
            timestamp: Date.now(),
            hasMore: cache.current.get(cacheKey)?.hasMore || false,
            page: cache.current.get(cacheKey)?.page || 0
          });
        }
        
        return updated;
      } else {
        console.log('[WhatsApp Messages] ➕ Mensagem não encontrada, adicionando:', updatedMessage.id);
        sentMessageIds.current.add(updatedMessage.id);
        
        // 🚀 CORREÇÃO: Mensagem atualizada vai no FINAL
        const newMessages = [...prev, updatedMessage];
        
        if (cacheKey) {
          cache.current.set(cacheKey, {
            messages: newMessages,
            timestamp: Date.now(),
            hasMore: cache.current.get(cacheKey)?.hasMore || false,
            page: cache.current.get(cacheKey)?.page || 0
          });
        }
        
        return newMessages;
      }
    });
  }, [cacheKey]);

  // Substituir mensagem otimista
  const replaceOptimisticMessage = useCallback((tempId: string, realMessage: Message) => {
    console.log('[WhatsApp Messages] 🔄 Substituindo mensagem otimista:', tempId, '→', realMessage.id);
    
    setMessages(prev => {
      const updated = prev.map(msg => 
        msg.id === tempId ? { ...realMessage, status: 'sent' as const } : msg
      );
      
      pendingOptimisticIds.current.delete(tempId);
      sentMessageIds.current.add(realMessage.id);
      
      // Atualizar cache isolado
      if (cacheKey) {
        cache.current.set(cacheKey, {
          messages: updated,
          timestamp: Date.now(),
          hasMore: cache.current.get(cacheKey)?.hasMore || false,
          page: cache.current.get(cacheKey)?.page || 0
        });
      }
      
      return updated;
    });
  }, [cacheKey]);

  // Remover mensagem otimista
  const removeOptimisticMessage = useCallback((tempId: string) => {
    console.log('[WhatsApp Messages] ❌ Removendo mensagem otimista:', tempId);
    
    setMessages(prev => {
      const filtered = prev.filter(msg => msg.id !== tempId);
      pendingOptimisticIds.current.delete(tempId);
      
      // Atualizar cache isolado
      if (cacheKey) {
        cache.current.set(cacheKey, {
          messages: filtered,
          timestamp: Date.now(),
          hasMore: cache.current.get(cacheKey)?.hasMore || false,
          page: cache.current.get(cacheKey)?.page || 0
        });
      }
      
      return filtered;
    });
  }, [cacheKey]);

  // Envio de mensagem (isolado)
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
      addMessage(optimisticMessage);

      // Enviar mensagem real
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
      console.error('[WhatsApp Messages] ❌ Erro crítico:', error);
      removeOptimisticMessage(tempId);
      toast.error(`Erro: ${error.message}`);
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedContact, activeInstance, user, addMessage, replaceOptimisticMessage, removeOptimisticMessage]);

  // 🚀 CORREÇÃO: Carregar mensagens quando contato MUDA (com/sem instância)
  useEffect(() => {
    console.log('[WhatsApp Messages] 📋 Effect executado:', {
      hasSelectedContact: !!selectedContact?.id,
      hasActiveInstance: !!activeInstance?.id,
      hasUserId: !!user?.id,
      selectedContactId: selectedContact?.id
    });

    if (selectedContact?.id && user?.id) {
      // Verificar se realmente mudou o contato
      if (lastFetchedContact.current !== selectedContact.id) {
        console.log('[WhatsApp Messages] 🎯 Mudança de contato:', 
          lastFetchedContact.current, '→', selectedContact.id
        );
        
        // 🚀 LIMPEZA TOTAL ao trocar contato
        lastFetchedContact.current = selectedContact.id;
        setCurrentPage(0);
        setMessages([]); // Limpar imediatamente
        cache.current.clear(); // Limpar todo cache
        sentMessageIds.current.clear();
        pendingOptimisticIds.current.clear();
        
        console.log('[WhatsApp Messages] 🧹 Cache limpo ao trocar contato');
        fetchMessages(0, false);
      } else {
        console.log('[WhatsApp Messages] ⏭️ Mesmo contato, sem recarregamento:', selectedContact.name);
      }
    } else {
      console.log('[WhatsApp Messages] 🧹 Limpando mensagens - sem contato ou usuário');
      setMessages([]);
      setHasMoreMessages(false);
      lastFetchedContact.current = null;
    }
  }, [selectedContact?.id, user?.id, fetchMessages]);

  // 🚀 PRE-POSITIONED: Posicionamento transferido para WhatsAppMessagesList com useLayoutEffect
  // Sem useEffect aqui - eliminando qualquer timing de scroll

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    isSendingMessage,
    sendMessage,
    loadMoreMessages,
    refreshMessages,
    addMessage,
    updateMessage,
    messagesEndRef
  };
};