
/**
 * 🎯 HOOK REALTIME SEM REFRESHES DESNECESSÁRIOS
 * 
 * CORREÇÕES APLICADAS:
 * ✅ Callbacks otimizados sem duplicação
 * ✅ Filtros rigorosos de multitenancy
 * ✅ Debounce para evitar spam de updates
 * ✅ Sistema de detecção de mensagens realmente novas
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

const isProduction = process.env.NODE_ENV === 'production';

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

  // 🚀 CORREÇÃO: Sistema de reconnection otimizado
  const reconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('[MessagesRealtime] ❌ Máximo de tentativas de reconnection atingido');
      return;
    }

    const delay = Math.min(Math.pow(2, reconnectAttempts.current) * 1000, 30000);
    reconnectAttempts.current++;
    
    console.log(`[MessagesRealtime] 🔄 Reconnecting em ${delay}ms (tentativa ${reconnectAttempts.current})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setupRealtime();
    }, delay);
  }, []);

  // 🚀 CORREÇÃO: Debounce para callbacks
  const debouncedCallback = useCallback((messageId: string, callback: () => void, delay = 500) => {
    // Limpar timer anterior se existir
    const existingTimer = debounceTimers.current.get(messageId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Criar novo timer
    const timer = setTimeout(() => {
      callback();
      debounceTimers.current.delete(messageId);
    }, delay);

    debounceTimers.current.set(messageId, timer);
  }, []);

  // 🚀 CORREÇÃO: Processar queue sem spam
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
      }, 200); // 200ms de debounce
    });
  }, [onNewMessage, onMessageUpdate, debouncedCallback]);
  
  // ✅ CORREÇÃO: Conversão com validação de timestamp
  const convertMessage = useCallback((messageData: any): Message => {
    const message: Message = {
      id: messageData.id,
      text: messageData.text || '',
      fromMe: messageData.from_me || false,
      timestamp: messageData.created_at || new Date().toISOString(),
      status: messageData.status || 'sent',
      mediaType: messageData.media_type || 'text',
      mediaUrl: messageData.media_url || undefined,
      sender: messageData.from_me ? 'user' : 'contact',
      time: new Date(messageData.created_at || Date.now()).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isIncoming: !messageData.from_me,
      media_cache: messageData.media_cache || null
    };

    // Atualizar último timestamp processado
    if (!lastProcessedTimestamp.current || message.timestamp > lastProcessedTimestamp.current) {
      lastProcessedTimestamp.current = message.timestamp;
    }

    return message;
  }, []);

  // 🚀 CORREÇÃO: Filtro rigoroso para mensagens realmente novas
  const shouldProcessMessage = useCallback((messageData: any, isUpdate = false): boolean => {
    // Validação de ownership
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

    // Para updates, permitir sempre (mudança de status)
    if (isUpdate) {
      return true;
    }

    // Para inserts, verificar se é realmente nova
    const messageTimestamp = messageData.created_at;
    
    // Verificar se já foi processada (evitar duplicação)
    if (processedMessageIds.current.has(messageData.id)) {
      return false;
    }

    // Para mensagens próprias em insert, ignorar (foram enviadas via API)
    if (messageData.from_me) {
      console.log(`[MessagesRealtime] 🚫 Mensagem própria ignorada (insert): ${messageData.id}`);
      return false;
    }

    // Verificar se a mensagem é mais nova que a última processada
    if (lastProcessedTimestamp.current && messageTimestamp <= lastProcessedTimestamp.current) {
      console.log(`[MessagesRealtime] 🚫 Mensagem antiga ignorada: ${messageData.id}`);
      return false;
    }

    // Marcar como processada
    processedMessageIds.current.add(messageData.id);
    
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
    
    // Limpar debounce timers
    debounceTimers.current.forEach(timer => clearTimeout(timer));
    debounceTimers.current.clear();
    
    processedMessageIds.current.clear();
    messageQueue.current = [];
    isConnected.current = false;
    reconnectAttempts.current = 0;
    lastProcessedTimestamp.current = null;
  }, []);

  // 🚀 CORREÇÃO: Setup realtime com debounce
  const setupRealtime = useCallback(() => {
    if (!selectedContact || !activeInstance || !user?.id) {
      cleanup();
      return;
    }

    console.log('[MessagesRealtime] 🚀 Configurando realtime:', {
      contactId: selectedContact.id,
      instanceId: activeInstance.id,
      userId: user.id,
      hasCallbacks: !!(onNewMessage && onMessageUpdate)
    });

    // Limpar canal anterior
    cleanup();

    const channelId = `messages-${selectedContact.id}-${activeInstance.id}-${user.id}-${Date.now()}`;

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `created_by_user_id=eq.${user.id}`
      }, (payload) => {
        const messageData = payload.new;
        
        if (!shouldProcessMessage(messageData, false)) {
          return;
        }

        const message = convertMessage(messageData);
        
        console.log('[MessagesRealtime] 📨 Nova mensagem externa:', {
          messageId: message.id,
          timestamp: message.timestamp
        });
        
        // Usar debounce para evitar spam
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
        
        // Usar debounce para updates
        debouncedCallback(`update_${message.id}`, () => {
          if (onMessageUpdate) {
            onMessageUpdate(message);
          }
        }, 50);
      })
      .subscribe((status) => {
        console.log('[MessagesRealtime] 📡 Status:', status);
        
        if (status === 'SUBSCRIBED') {
          isConnected.current = true;
          reconnectAttempts.current = 0;
          processMessageQueue();
          console.log('[MessagesRealtime] ✅ Conectado');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[MessagesRealtime] ❌ Erro na conexão:', status);
          isConnected.current = false;
          reconnect();
        } else if (status === 'CLOSED') {
          isConnected.current = false;
        }
      });

    channelRef.current = channel;
  }, [selectedContact, activeInstance, user?.id, convertMessage, onNewMessage, onMessageUpdate, cleanup, shouldProcessMessage, reconnect, processMessageQueue, debouncedCallback]);

  // Configurar realtime
  useEffect(() => {
    if (user?.id && selectedContact && activeInstance) {
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
