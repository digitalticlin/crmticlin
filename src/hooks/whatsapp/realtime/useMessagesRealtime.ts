
/**
 * 🎯 HOOK REALTIME CORRIGIDO - MULTITENANCY E PERFORMANCE
 * 
 * CORREÇÕES APLICADAS:
 * ✅ Callbacks conectados corretamente
 * ✅ Filtros de multitenancy otimizados
 * ✅ Suporte a updates de status de mensagens próprias
 * ✅ Log detalhado para debug
 * ✅ Sistema de reconnection melhorado
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
  const lastProcessedMessage = useRef<string | null>(null);

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

  // 🚀 CORREÇÃO: Processar queue de mensagens perdidas
  const processMessageQueue = useCallback(() => {
    if (messageQueue.current.length === 0) return;
    
    console.log(`[MessagesRealtime] 📦 Processando ${messageQueue.current.length} mensagens da queue`);
    
    const messages = [...messageQueue.current];
    messageQueue.current = [];
    
    messages.forEach(message => {
      if (message.fromMe && onMessageUpdate) {
        onMessageUpdate(message);
      } else if (!message.fromMe && onNewMessage) {
        onNewMessage(message);
      }
    });
  }, [onNewMessage, onMessageUpdate]);
  
  // ✅ CORREÇÃO: Conversão otimizada com log detalhado
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

    if (!isProduction) {
      console.log(`[MessagesRealtime] 🔄 Convertendo mensagem:`, {
        id: message.id,
        fromMe: message.fromMe,
        text: message.text.substring(0, 30) + '...',
        status: message.status
      });
    }

    return message;
  }, []);

  // 🚀 CORREÇÃO: Filtro otimizado para permitir updates de status
  const shouldProcessMessage = useCallback((messageData: any, isUpdate = false): boolean => {
    // Validação de ownership
    if (!user?.id || messageData.created_by_user_id !== user.id) {
      console.warn('[MessagesRealtime] 🚨 Tentativa de acesso cross-user:', {
        userId: user?.id,
        messageOwner: messageData.created_by_user_id,
        messageId: messageData.id
      });
      return false;
    }

    // Verificar se já foi processada (evitar duplicação)
    if (processedMessageIds.current.has(messageData.id)) {
      return false;
    }

    // ✅ CORREÇÃO: Para updates, permitir mensagens próprias (mudança de status)
    if (isUpdate) {
      // Updates são sempre permitidos (mudança de status)
      console.log(`[MessagesRealtime] 🔄 Update de mensagem permitido: ${messageData.id}`);
      return true;
    }

    // ✅ CORREÇÃO: Para inserts, filtrar apenas mensagens externas
    if (messageData.from_me) {
      console.log(`[MessagesRealtime] 🚫 Mensagem própria ignorada (insert): ${messageData.id}`);
      return false;
    }

    // Filtrar por instância e contato
    if (messageData.whatsapp_number_id !== activeInstance?.id) {
      return false;
    }

    if (messageData.lead_id !== selectedContact?.id) {
      return false;
    }

    // Marcar como processada
    processedMessageIds.current.add(messageData.id);
    lastProcessedMessage.current = messageData.id;
    
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
    
    processedMessageIds.current.clear();
    messageQueue.current = [];
    isConnected.current = false;
    reconnectAttempts.current = 0;
    lastProcessedMessage.current = null;
  }, []);

  // 🚀 CORREÇÃO: Setup realtime com callbacks conectados
  const setupRealtime = useCallback(() => {
    if (!selectedContact || !activeInstance || !user?.id) {
      cleanup();
      return;
    }

    console.log('[MessagesRealtime] 🚀 Configurando realtime:', {
      contactId: selectedContact.id,
      instanceId: activeInstance.id,
      userId: user.id,
      hasNewMessageCallback: !!onNewMessage,
      hasUpdateCallback: !!onMessageUpdate
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
          fromMe: message.fromMe,
          text: message.text.substring(0, 30) + '...',
          hasCallback: !!onNewMessage
        });
        
        // Adicionar à queue se desconectado
        if (!isConnected.current) {
          messageQueue.current.push(message);
          return;
        }
        
        // ✅ CORREÇÃO: Chamar callback correto
        if (onNewMessage) {
          onNewMessage(message);
        }
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
          fromMe: message.fromMe,
          status: message.status,
          hasCallback: !!onMessageUpdate
        });
        
        // ✅ CORREÇÃO: Chamar callback correto
        if (onMessageUpdate) {
          onMessageUpdate(message);
        }
      })
      .subscribe((status) => {
        console.log('[MessagesRealtime] 📡 Status:', status);
        
        if (status === 'SUBSCRIBED') {
          isConnected.current = true;
          reconnectAttempts.current = 0;
          processMessageQueue();
          console.log('[MessagesRealtime] ✅ Conectado e processando queue');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[MessagesRealtime] ❌ Erro na conexão:', status);
          isConnected.current = false;
          reconnect();
        } else if (status === 'CLOSED') {
          isConnected.current = false;
        }
      });

    channelRef.current = channel;
  }, [selectedContact, activeInstance, user?.id, convertMessage, onNewMessage, onMessageUpdate, cleanup, shouldProcessMessage, reconnect, processMessageQueue]);

  // Configurar realtime
  useEffect(() => {
    if (user?.id && selectedContact && activeInstance) {
      setupRealtime();
    } else {
      cleanup();
    }

    return cleanup;
  }, [user?.id, selectedContact, activeInstance, setupRealtime, cleanup]);

  // Heartbeat para detectar conexões mortas
  useEffect(() => {
    if (!channelRef.current) return;
    
    const heartbeat = setInterval(() => {
      if (channelRef.current && channelRef.current.state === 'closed') {
        console.log('[MessagesRealtime] 💔 Conexão morta detectada');
        isConnected.current = false;
        reconnect();
      }
    }, 30000);

    return () => clearInterval(heartbeat);
  }, [reconnect]);

  return {
    isConnected: isConnected.current,
    reconnectAttempts: reconnectAttempts.current,
    queuedMessages: messageQueue.current.length,
    lastProcessedMessage: lastProcessedMessage.current
  };
};
