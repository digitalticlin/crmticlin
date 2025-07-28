
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

// ✅ SINGLETON OTIMIZADO PARA REALTIME
const realtimeManager = {
  currentChannel: null as any,
  currentConfig: '',
  setupPromise: null as Promise<void> | null,
  isSettingUp: false,
  lastSetup: 0,
  cleanupTimeout: null as NodeJS.Timeout | null,
  connectionAttempts: 0,
  maxAttempts: 3
};

export const useMessagesRealtime = ({
  selectedContact,
  activeInstance,
  onNewMessage,
  onMessageUpdate
}: UseMessagesRealtimeProps) => {
  
  const isConnectedRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  
  // ✅ CONVERSÃO OTIMIZADA COM LOGS DETALHADOS
  const convertMessage = useCallback((messageData: any): Message => {
    const message = {
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

    console.log('[Messages Realtime] 🔄 Mensagem convertida:', {
      id: message.id,
      fromMe: message.fromMe,
      text: message.text.substring(0, 50) + '...',
      timestamp: message.timestamp
    });

    return message;
  }, []);

  // ✅ CLEANUP MELHORADO COM RETRY RESET
  const cleanup = useCallback(() => {
    if (realtimeManager.cleanupTimeout) {
      clearTimeout(realtimeManager.cleanupTimeout);
      realtimeManager.cleanupTimeout = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (realtimeManager.currentChannel) {
      console.log('[Messages Realtime] 🧹 Limpando canal realtime');
      try {
        supabase.removeChannel(realtimeManager.currentChannel);
        console.log('[Messages Realtime] 🔌 Canal removido com sucesso');
      } catch (error) {
        console.warn('[Messages Realtime] ⚠️ Erro ao remover canal:', error);
      } finally {
        realtimeManager.currentChannel = null;
        realtimeManager.currentConfig = '';
        realtimeManager.isSettingUp = false;
        realtimeManager.setupPromise = null;
        realtimeManager.connectionAttempts = 0;
        isConnectedRef.current = false;
      }
    }
  }, []);

  // ✅ HANDLER OTIMIZADO COM DEBOUNCE REDUZIDO (50ms)
  const handleNewMessage = useCallback((payload: any) => {
    if (!payload?.new || !selectedContact || !activeInstance || !isMountedRef.current) {
      console.log('[Messages Realtime] ⚠️ Payload inválido ou contexto perdido');
      return;
    }
    
    const messageData = payload.new;
    
    // ✅ FILTROS RIGOROSOS COM LOGS
    if (messageData.whatsapp_number_id !== activeInstance.id) {
      console.log('[Messages Realtime] ⚠️ Mensagem de instância diferente ignorada');
      return;
    }
    
    if (messageData.lead_id !== selectedContact.id) {
      console.log('[Messages Realtime] ⚠️ Mensagem de contato diferente ignorada');
      return;
    }

    console.log('[Messages Realtime] 📨 Nova mensagem recebida via realtime:', {
      messageId: messageData.id,
      leadId: messageData.lead_id,
      instanceId: messageData.whatsapp_number_id,
      fromMe: messageData.from_me,
      text: messageData.text?.substring(0, 30) + '...'
    });

    // ✅ DEBOUNCE REDUZIDO PARA 50ms (mais responsivo)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      try {
        const message = convertMessage(messageData);
        if (onNewMessage) {
          console.log('[Messages Realtime] ✅ Processando nova mensagem:', message.id);
          onNewMessage(message);
        }
      } catch (error) {
        console.error('[Messages Realtime] ❌ Erro ao processar mensagem:', error);
      }
    }, 50); // ✅ REDUZIDO DE 150ms PARA 50ms
  }, [selectedContact?.id, activeInstance?.id, convertMessage, onNewMessage]);

  const handleMessageUpdate = useCallback((payload: any) => {
    if (!payload?.new || !selectedContact || !activeInstance || !isMountedRef.current) return;
    
    const messageData = payload.new;
    
    if (messageData.whatsapp_number_id !== activeInstance.id) return;
    if (messageData.lead_id !== selectedContact.id) return;

    console.log('[Messages Realtime] 🔄 Mensagem atualizada via realtime:', messageData.id);

    try {
      const message = convertMessage(messageData);
      if (onMessageUpdate) {
        onMessageUpdate(message);
      }
    } catch (error) {
      console.error('[Messages Realtime] ❌ Erro ao processar atualização:', error);
    }
  }, [selectedContact?.id, activeInstance?.id, convertMessage, onMessageUpdate]);

  // ✅ RETRY AUTOMÁTICO PARA FALHAS DE CONEXÃO
  const retryConnection = useCallback(() => {
    if (realtimeManager.connectionAttempts < realtimeManager.maxAttempts) {
      realtimeManager.connectionAttempts++;
      console.log(`[Messages Realtime] 🔄 Tentativa de reconexão ${realtimeManager.connectionAttempts}/${realtimeManager.maxAttempts}`);
      
      retryTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          cleanup();
          setupRealtime();
        }
      }, 2000 * realtimeManager.connectionAttempts); // Backoff exponencial
    } else {
      console.error('[Messages Realtime] ❌ Máximo de tentativas de reconexão atingido');
    }
  }, []);

  // ✅ SETUP OTIMIZADO COM RETRY AUTOMÁTICO
  const setupRealtime = useCallback(async () => {
    if (!selectedContact || !activeInstance) {
      cleanup();
      return;
    }

    const currentConfig = `${selectedContact.id}-${activeInstance.id}`;
    const now = Date.now();
    
    // ✅ EVITAR SETUP DESNECESSÁRIO
    if (realtimeManager.currentConfig === currentConfig && 
        realtimeManager.currentChannel && 
        isConnectedRef.current) {
      console.log('[Messages Realtime] ✅ Canal já ativo para esta configuração');
      return;
    }
    
    // ✅ DEBOUNCE SETUP REDUZIDO
    if (now - realtimeManager.lastSetup < 100) {
      console.log('[Messages Realtime] ⏳ Aguardando debounce...');
      return;
    }
    
    if (realtimeManager.isSettingUp) {
      if (realtimeManager.setupPromise) {
        await realtimeManager.setupPromise;
      }
      return;
    }

    realtimeManager.isSettingUp = true;
    realtimeManager.lastSetup = now;
    
    console.log('[Messages Realtime] 🚀 Configurando realtime otimizado:', {
      contactId: selectedContact.id.substring(0, 8),
      instanceId: activeInstance.id.substring(0, 8),
      attempt: realtimeManager.connectionAttempts + 1
    });

    cleanup();

    // ✅ AUTO-CLEANUP OTIMIZADO
    realtimeManager.cleanupTimeout = setTimeout(() => {
      console.log('[Messages Realtime] ⏰ Auto-cleanup por timeout');
      cleanup();
    }, 300000); // 5 minutos

    try {
      const channelId = `messages-${selectedContact.id}-${activeInstance.id}-${now}`;

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
          console.log('[Messages Realtime] 📡 Status da conexão:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('[Messages Realtime] ✅ Conectado com sucesso ao realtime');
            isConnectedRef.current = true;
            realtimeManager.currentChannel = channel;
            realtimeManager.currentConfig = currentConfig;
            realtimeManager.connectionAttempts = 0; // Reset contador
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('[Messages Realtime] ❌ Erro na conexão:', status);
            isConnectedRef.current = false;
            retryConnection();
          } else if (status === 'CLOSED') {
            console.log('[Messages Realtime] 🔒 Canal fechado');
            isConnectedRef.current = false;
          }
        });

    } catch (error) {
      console.error('[Messages Realtime] ❌ Erro crítico ao criar canal:', error);
      retryConnection();
    } finally {
      realtimeManager.isSettingUp = false;
    }
  }, [selectedContact?.id, activeInstance?.id, handleNewMessage, handleMessageUpdate, cleanup, retryConnection]);

  // ✅ EFEITO PRINCIPAL COM DEBOUNCE REDUZIDO
  useEffect(() => {
    isMountedRef.current = true;
    
    const setupTimer = setTimeout(() => {
      if (isMountedRef.current) {
        setupRealtime();
      }
    }, 50); // ✅ REDUZIDO DE 100ms PARA 50ms

    return () => {
      clearTimeout(setupTimer);
      isMountedRef.current = false;
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [setupRealtime]);

  // ✅ CLEANUP FINAL
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected: isConnectedRef.current,
    connectionAttempts: realtimeManager.connectionAttempts,
    maxAttempts: realtimeManager.maxAttempts
  };
};
