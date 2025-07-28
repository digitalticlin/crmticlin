
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  
  const channelRef = useRef<any>(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 3;
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const isConnectedRef = useRef(false);
  
  // ✅ CONVERSÃO OTIMIZADA DE MENSAGEM - ESTÁVEL
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

  // ✅ CLEANUP COM PROTEÇÃO
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log('[Messages Realtime] 🧹 Limpando canal');
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('[Messages Realtime] ⚠️ Erro ao remover canal:', error);
      }
      channelRef.current = null;
    }
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    isConnectedRef.current = false;
    reconnectAttempts.current = 0;
  }, []);

  // ✅ RECONEXÃO AUTOMÁTICA - CONTROLADA
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[Messages Realtime] ❌ Máximo de tentativas de reconexão atingido');
      return;
    }

    if (isConnectedRef.current) {
      console.log('[Messages Realtime] ⚠️ Já conectado, ignorando reconexão');
      return;
    }

    reconnectAttempts.current++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
    
    console.log(`[Messages Realtime] 🔄 Tentativa de reconexão ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS} em ${delay}ms`);
    
    setTimeout(() => {
      if (!isConnectedRef.current && selectedContact && activeInstance) {
        cleanup();
        // O useEffect será executado novamente devido às dependências
      }
    }, delay);
  }, [selectedContact, activeInstance, cleanup]);

  // ✅ HANDLER PARA NOVAS MENSAGENS - OTIMIZADO
  const handleNewMessage = useCallback((payload: any) => {
    const messageData = payload.new;
    
    console.log('[Messages Realtime] 📨 Nova mensagem:', {
      messageId: messageData.id,
      leadId: messageData.lead_id,
      fromMe: messageData.from_me,
      instanceId: messageData.whatsapp_number_id
    });

    // ✅ FILTRO: Verificar instância
    if (messageData.whatsapp_number_id !== activeInstance?.id) {
      console.log('[Messages Realtime] 🚫 Mensagem de outra instância ignorada');
      return;
    }

    // ✅ FILTRO: Verificar contato
    if (messageData.lead_id !== selectedContact?.id) {
      console.log('[Messages Realtime] 🚫 Mensagem de outro contato ignorada');
      return;
    }

    // ✅ DEBOUNCE PARA EVITAR MÚLTIPLAS ATUALIZAÇÕES
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const message = convertMessage(messageData);
        
        if (onNewMessage) {
          console.log('[Messages Realtime] ➕ Adicionando nova mensagem');
          onNewMessage(message);
        }
        
        reconnectAttempts.current = 0;
      } catch (error) {
        console.error('[Messages Realtime] ❌ Erro ao processar nova mensagem:', error);
      }
    }, 100);
  }, [selectedContact?.id, activeInstance?.id, convertMessage, onNewMessage]);

  // ✅ HANDLER PARA MENSAGENS ATUALIZADAS - OTIMIZADO
  const handleMessageUpdate = useCallback((payload: any) => {
    const messageData = payload.new;
    
    console.log('[Messages Realtime] 🔄 Mensagem atualizada:', {
      messageId: messageData.id,
      leadId: messageData.lead_id,
      instanceId: messageData.whatsapp_number_id
    });
    
    // ✅ FILTROS
    if (messageData.whatsapp_number_id !== activeInstance?.id) {
      return;
    }

    if (messageData.lead_id !== selectedContact?.id) {
      return;
    }

    try {
      const message = convertMessage(messageData);
      
      if (onMessageUpdate) {
        console.log('[Messages Realtime] 🔄 Atualizando mensagem');
        onMessageUpdate(message);
      }
    } catch (error) {
      console.error('[Messages Realtime] ❌ Erro ao processar atualização:', error);
    }
  }, [selectedContact?.id, activeInstance?.id, convertMessage, onMessageUpdate]);

  // ✅ EFEITO PRINCIPAL - OTIMIZADO
  useEffect(() => {
    if (!selectedContact || !activeInstance) {
      cleanup();
      return;
    }

    // ✅ EVITAR MÚLTIPLAS CONEXÕES
    if (isConnectedRef.current) {
      console.log('[Messages Realtime] ⚠️ Já conectado, ignorando nova conexão');
      return;
    }

    console.log('[Messages Realtime] 🚀 Configurando realtime para:', {
      contactId: selectedContact.id,
      instanceId: activeInstance.id
    });

    cleanup();

    const channelId = `messages-${selectedContact.id}-${activeInstance.id}-${Date.now()}`;

    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${selectedContact.id}`
        },
        handleNewMessage
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${selectedContact.id}`
        },
        handleMessageUpdate
      )
      .subscribe((status) => {
        console.log('[Messages Realtime] 📡 Status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('[Messages Realtime] ✅ Conectado com sucesso');
          isConnectedRef.current = true;
          reconnectAttempts.current = 0;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Messages Realtime] ❌ Erro na conexão:', status);
          isConnectedRef.current = false;
          attemptReconnect();
        } else if (status === 'CLOSED') {
          console.log('[Messages Realtime] 🔒 Canal fechado');
          isConnectedRef.current = false;
        }
      });

    channelRef.current = channel;

    return cleanup;
  }, [selectedContact?.id, activeInstance?.id, handleNewMessage, handleMessageUpdate, cleanup, attemptReconnect]);

  // ✅ CLEANUP GERAL
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isConnected: isConnectedRef.current,
    reconnectAttempts: reconnectAttempts.current
  };
};
