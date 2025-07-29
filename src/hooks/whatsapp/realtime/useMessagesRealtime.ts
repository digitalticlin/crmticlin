
/**
 * 🎯 HOOK REALTIME CORRIGIDO - MULTITENANCY E RESILÊNCIA
 * 
 * CORREÇÕES APLICADAS:
 * ✅ Validação dupla de ownership em todos os callbacks
 * ✅ Sistema de reconnection com retry exponencial
 * ✅ Heartbeat para detectar conexões mortas
 * ✅ Filtros rigorosos de multitenancy
 * ✅ Isolamento total por usuário
 * ✅ Queue de mensagens perdidas durante desconexão
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
  
  const { user } = useAuth(); // 🚀 CORREÇÃO: Conectar diretamente ao useAuth
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const processedMessageIds = useRef<Set<string>>(new Set());
  const messageQueue = useRef<Message[]>([]); // 🚀 CORREÇÃO: Queue para mensagens perdidas
  const isConnected = useRef(false);

  // 🚀 CORREÇÃO: Sistema de reconnection com retry exponencial
  const reconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('[MessagesRealtime] ❌ Máximo de tentativas de reconnection atingido');
      return;
    }

    const delay = Math.pow(2, reconnectAttempts.current) * 1000;
    reconnectAttempts.current++;
    
    console.log(`[MessagesRealtime] 🔄 Tentativa de reconnection ${reconnectAttempts.current}/${maxReconnectAttempts} em ${delay}ms`);
    
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
      if (onNewMessage) {
        onNewMessage(message);
      }
    });
  }, [onNewMessage]);
  
  // Conversão otimizada de mensagem do banco para UI
  const convertMessage = useCallback((messageData: any): Message => {
    return {
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
    } satisfies Message;
  }, []);

  // 🚀 CORREÇÃO: Filtro com validação dupla de ownership
  const shouldProcessMessage = useCallback((messageData: any): boolean => {
    // 🚀 CORREÇÃO: Validação dupla de ownership
    if (!user?.id || messageData.created_by_user_id !== user.id) {
      console.warn('[MessagesRealtime] 🚨 Tentativa de acesso cross-user bloqueada:', {
        userId: user?.id,
        messageOwner: messageData.created_by_user_id,
        messageId: messageData.id
      });
      return false;
    }

    // Verificar se já foi processada
    if (processedMessageIds.current.has(messageData.id)) {
      if (!isProduction) {
        console.log(`[MessagesRealtime] 🚫 Mensagem já processada: ${messageData.id}`);
      }
      return false;
    }

    // ✅ FILTRO PRINCIPAL: Mensagens próprias são tratadas localmente
    if (messageData.from_me) {
      if (!isProduction) {
        console.log(`[MessagesRealtime] 🚫 Mensagem própria ignorada: ${messageData.id}`);
      }
      return false;
    }

    // ✅ FILTRO SECUNDÁRIO: Apenas mensagens da instância correta
    if (messageData.whatsapp_number_id !== activeInstance?.id) {
      return false;
    }

    // ✅ FILTRO TERCIÁRIO: Apenas mensagens do contato selecionado
    if (messageData.lead_id !== selectedContact?.id) {
      return false;
    }

    // Marcar como processada
    processedMessageIds.current.add(messageData.id);
    return true;
  }, [selectedContact, activeInstance, user?.id]);

  // Cleanup otimizado
  const cleanup = useCallback(() => {
    // Limpar timeouts de reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (channelRef.current) {
      if (!isProduction) {
        console.log('[MessagesRealtime] 🧹 Limpando canal');
      }
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    // Limpar cache de mensagens processadas
    processedMessageIds.current.clear();
    isConnected.current = false;
    reconnectAttempts.current = 0;
  }, []);

  // 🚀 CORREÇÃO: Setup realtime com validação rigorosa
  const setupRealtime = useCallback(() => {
    // 🚀 CORREÇÃO: Validação rigorosa de usuário
    if (!selectedContact || !activeInstance || !user?.id) {
      cleanup();
      return;
    }

    if (!isProduction) {
      console.log('[MessagesRealtime] 🚀 Configurando realtime para:', {
        contactId: selectedContact.id,
        instanceId: activeInstance.id,
        userId: user.id
      });
    }

    // Limpar canal anterior
    cleanup();

    // Criar novo canal
    const channelId = `messages-${selectedContact.id}-${activeInstance.id}-${user.id}-${Date.now()}`;

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `created_by_user_id=eq.${user.id}` // 🚀 CORREÇÃO: Filtro rigoroso
      }, (payload) => {
        const messageData = payload.new;
        
        if (!shouldProcessMessage(messageData)) {
          return;
        }

        const message = convertMessage(messageData);
        
        if (!isProduction) {
          console.log('[MessagesRealtime] 📨 Nova mensagem externa:', {
            messageId: message.id,
            fromMe: message.fromMe,
            text: message.text.substring(0, 50) + '...'
          });
        }
        
        // 🚀 CORREÇÃO: Adicionar à queue se desconectado
        if (!isConnected.current) {
          messageQueue.current.push(message);
          return;
        }
        
        if (onNewMessage) {
          onNewMessage(message);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `created_by_user_id=eq.${user.id}` // 🚀 CORREÇÃO: Filtro rigoroso
      }, (payload) => {
        const messageData = payload.new;
        
        // 🚀 CORREÇÃO: Validação dupla de ownership para updates
        if (!user?.id || messageData.created_by_user_id !== user.id) {
          console.warn('[MessagesRealtime] 🚨 Tentativa de acesso cross-user bloqueada (update):', {
            userId: user?.id,
            messageOwner: messageData.created_by_user_id,
            messageId: messageData.id
          });
          return;
        }

        // Para updates, permitir mensagens próprias (mudança de status)
        if (messageData.whatsapp_number_id !== activeInstance.id) {
          return;
        }

        const message = convertMessage(messageData);
        
        if (!isProduction) {
          console.log('[MessagesRealtime] 🔄 Mensagem atualizada:', {
            messageId: message.id,
            fromMe: message.fromMe,
            status: message.status
          });
        }
        
        if (onMessageUpdate) {
          onMessageUpdate(message);
        }
      })
      .subscribe((status) => {
        if (!isProduction) {
          console.log('[MessagesRealtime] 📡 Status:', status);
        }
        
        if (status === 'SUBSCRIBED') {
          isConnected.current = true;
          reconnectAttempts.current = 0; // Reset tentativas após sucesso
          
          // 🚀 CORREÇÃO: Processar queue quando reconectar
          processMessageQueue();
          
          if (!isProduction) {
            console.log('[MessagesRealtime] ✅ Conectado com sucesso');
          }
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

  // 🚀 CORREÇÃO: Configurar realtime apenas quando usuário estiver autenticado
  useEffect(() => {
    if (user?.id && selectedContact && activeInstance) {
      setupRealtime();
    } else {
      cleanup();
    }

    return cleanup;
  }, [user?.id, selectedContact, activeInstance, setupRealtime, cleanup]);

  // 🚀 CORREÇÃO: Heartbeat para detectar conexões mortas
  useEffect(() => {
    if (!channelRef.current) return;
    
    const heartbeat = setInterval(() => {
      if (channelRef.current && channelRef.current.state === 'closed') {
        console.log('[MessagesRealtime] 💔 Conexão morta detectada, reconnectando...');
        isConnected.current = false;
        reconnect();
      }
    }, 30000); // Check a cada 30 segundos

    return () => clearInterval(heartbeat);
  }, [reconnect]);

  return {
    isConnected: isConnected.current,
    reconnectAttempts: reconnectAttempts.current,
    queuedMessages: messageQueue.current.length
  };
};
