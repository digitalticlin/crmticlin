
/**
 * 🎯 HOOK REALTIME OTIMIZADO - SEM RECONEXÕES EXCESSIVAS
 * 
 * CORREÇÕES APLICADAS:
 * ✅ Conexão estável sem recreação desnecessária
 * ✅ Debounce eficiente
 * ✅ Cache de mensagens processadas
 * ✅ Logs detalhados para debug
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Contact, Message } from '../../../types/chat';
import { WhatsAppWebInstance } from '../../../types/whatsapp';

interface UseMessagesRealtimeProps {
  selectedContact: Contact | null;
  activeInstance: WhatsAppWebInstance | null;
  onNewMessage?: (message: Message) => void;
  onMessageUpdate?: (message: Message) => void;
}

export const useMessagesRealtime = ({
  selectedContact,
  activeInstance,
  onNewMessage,
  onMessageUpdate
}: UseMessagesRealtimeProps) => {
  
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const processedMessageIds = useRef<Set<string>>(new Set());
  const messageQueue = useRef<Message[]>([]);
  const isConnected = useRef(false);
  const lastProcessedTimestamp = useRef<string | null>(null);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const currentChannelKey = useRef<string | null>(null);

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

  // 🚀 Debounce otimizado
  const debouncedCallback = useCallback((messageId: string, callback: () => void, delay = 300) => {
    const existingTimer = debounceTimers.current.get(messageId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      callback();
      debounceTimers.current.delete(messageId);
    }, delay);

    debounceTimers.current.set(messageId, timer);
  }, []);

  // 🚀 Processar queue de mensagens
  const processMessageQueue = useCallback(() => {
    if (messageQueue.current.length === 0) return;
    
    console.log(`[MessagesRealtime] 📦 Processando ${messageQueue.current.length} mensagens da queue`);
    
    const messages = [...messageQueue.current];
    messageQueue.current = [];
    
    messages.forEach(message => {
      debouncedCallback(message.id, () => {
        if (message.fromMe && onMessageUpdate) {
          onMessageUpdate(message);
        } else if (!message.fromMe && onNewMessage) {
          onNewMessage(message);
        }
      }, 200);
    });
  }, [onNewMessage, onMessageUpdate, debouncedCallback]);
  
  // ✅ Conversão otimizada
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

    if (!lastProcessedTimestamp.current || message.timestamp > lastProcessedTimestamp.current) {
      lastProcessedTimestamp.current = message.timestamp;
    }

    return message;
  }, []);

  // 🚀 CORREÇÃO: Filtro permissivo para mensagens externas
  const shouldProcessMessage = useCallback((messageData: any, isUpdate = false): boolean => {
    // Validação básica de ownership
    if (!user?.id || messageData.created_by_user_id !== user.id) {
      return false;
    }

    // Filtrar por instância e contato
    if (messageData.whatsapp_number_id !== activeInstance?.id) {
      return false;
    }

    if (messageData.lead_id !== selectedContact?.id) {
      return false;
    }

    // Para updates, permitir sempre
    if (isUpdate) {
      return true;
    }

    // 🚀 CORREÇÃO PRINCIPAL: Permitir mensagens externas no INSERT
    if (messageData.from_me === false) {
      console.log(`[MessagesRealtime] ✅ MENSAGEM EXTERNA ACEITA: ${messageData.id}`);
      return true;
    }

    // Para mensagens próprias, verificar duplicação
    if (processedMessageIds.current.has(messageData.id)) {
      console.log(`[MessagesRealtime] ❌ Mensagem já processada: ${messageData.id}`);
      return false;
    }

    return true;
  }, [selectedContact, activeInstance, user?.id]);

  // Cleanup otimizado
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (channelRef.current) {
      console.log('[MessagesRealtime] 🧹 Removendo canal');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    debounceTimers.current.forEach(timer => clearTimeout(timer));
    debounceTimers.current.clear();
    
    processedMessageIds.current.clear();
    messageQueue.current = [];
    isConnected.current = false;
    reconnectAttempts.current = 0;
    lastProcessedTimestamp.current = null;
    currentChannelKey.current = null;
  }, []);

  // 🚀 Setup realtime com controle de reconexão
  const setupRealtime = useCallback(() => {
    if (!selectedContact || !activeInstance || !user?.id) {
      cleanup();
      return;
    }

    const newChannelKey = `${selectedContact.id}-${activeInstance.id}-${user.id}`;
    
    // 🚀 CORREÇÃO: Evitar reconexão desnecessária
    if (currentChannelKey.current === newChannelKey && channelRef.current) {
      console.log('[MessagesRealtime] ⏭️ Canal já conectado, evitando reconexão');
      return;
    }

    console.log('[MessagesRealtime] 🚀 Configurando realtime OTIMIZADO:', {
      contactId: selectedContact.id,
      contactName: selectedContact.name,
      instanceId: activeInstance.id,
      userId: user.id,
      channelKey: newChannelKey
    });

    // Limpar canal anterior apenas se diferente
    if (currentChannelKey.current !== newChannelKey) {
      cleanup();
    }

    currentChannelKey.current = newChannelKey;
    const channelId = `messages-${newChannelKey}-${Date.now()}`;

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `created_by_user_id=eq.${user.id}`
      }, (payload) => {
        const messageData = payload.new;
        
        console.log('[MessagesRealtime] 📨 INSERT recebido:', {
          messageId: messageData.id,
          fromMe: messageData.from_me,
          leadId: messageData.lead_id,
          text: messageData.text?.substring(0, 30) + '...'
        });

        if (!shouldProcessMessage(messageData, false)) {
          return;
        }

        const message = convertMessage(messageData);
        
        console.log('[MessagesRealtime] ✅ MENSAGEM PROCESSADA:', {
          messageId: message.id,
          fromMe: message.fromMe,
          isExternal: !message.fromMe
        });
        
        // Marcar como processada
        processedMessageIds.current.add(message.id);
        
        // Processar com debounce
        debouncedCallback(message.id, () => {
          if (isConnected.current && onNewMessage) {
            onNewMessage(message);
          } else {
            messageQueue.current.push(message);
          }
        }, 100);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `created_by_user_id=eq.${user.id}`
      }, (payload) => {
        const messageData = payload.new;
        
        if (!shouldProcessMessage(messageData, true)) {
          return;
        }

        const message = convertMessage(messageData);
        
        console.log('[MessagesRealtime] 🔄 Mensagem atualizada:', {
          messageId: message.id,
          status: message.status
        });
        
        debouncedCallback(`update_${message.id}`, () => {
          if (onMessageUpdate) {
            onMessageUpdate(message);
          }
        }, 50);
      })
      .subscribe((status) => {
        console.log('[MessagesRealtime] 📡 Status da conexão:', status);
        
        if (status === 'SUBSCRIBED') {
          isConnected.current = true;
          reconnectAttempts.current = 0;
          processMessageQueue();
          console.log('[MessagesRealtime] ✅ CONECTADO - PRONTO PARA RECEBER MENSAGENS');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[MessagesRealtime] ❌ Erro na conexão:', status);
          isConnected.current = false;
          // Não reconectar automaticamente para evitar loops
        } else if (status === 'CLOSED') {
          isConnected.current = false;
        }
      });

    channelRef.current = channel;
  }, [selectedContact, activeInstance, user?.id, convertMessage, onNewMessage, onMessageUpdate, cleanup, shouldProcessMessage, processMessageQueue, debouncedCallback]);

  // 🚀 CORREÇÃO: Effect otimizado - evitar reconexões desnecessárias
  useEffect(() => {
    const shouldConnect = user?.id && selectedContact && activeInstance;
    
    if (shouldConnect) {
      setupRealtime();
    } else {
      cleanup();
    }

    return cleanup;
  }, [user?.id, selectedContact?.id, activeInstance?.id, setupRealtime, cleanup]);

  return {
    isConnected: isConnected.current,
    reconnectAttempts: reconnectAttempts.current,
    queuedMessages: messageQueue.current.length,
    lastProcessedMessage: lastProcessedTimestamp.current
  };
};
