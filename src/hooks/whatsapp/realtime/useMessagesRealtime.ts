
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

// ✅ SINGLETON PARA EVITAR MÚLTIPLOS CANAIS
const realtimeManager = {
  currentChannel: null as any,
  currentConfig: '',
  setupPromise: null as Promise<void> | null,
  isSettingUp: false,
  lastSetup: 0,
  cleanupTimeout: null as NodeJS.Timeout | null
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

  // ✅ CLEANUP CONTROLADO GLOBAL
  const cleanup = useCallback(() => {
    if (realtimeManager.cleanupTimeout) {
      clearTimeout(realtimeManager.cleanupTimeout);
      realtimeManager.cleanupTimeout = null;
    }
    
    if (realtimeManager.currentChannel) {
      console.log('[Messages Realtime] 🧹 Iniciando cleanup');
      try {
        supabase.removeChannel(realtimeManager.currentChannel);
        console.log('[Messages Realtime] 🔌 Canal removido');
      } catch (error) {
        console.warn('[Messages Realtime] ⚠️ Erro ao remover canal:', error);
      } finally {
        realtimeManager.currentChannel = null;
        realtimeManager.currentConfig = '';
        realtimeManager.isSettingUp = false;
        realtimeManager.setupPromise = null;
        isConnectedRef.current = false;
        console.log('[Messages Realtime] ✅ Cleanup concluído');
      }
    }
  }, []);

  // ✅ HANDLERS ESTÁVEIS
  const handleNewMessage = useCallback((payload: any) => {
    if (!payload?.new || !selectedContact || !activeInstance || !isMountedRef.current) return;
    
    const messageData = payload.new;
    
    // ✅ FILTROS RIGOROSOS
    if (messageData.whatsapp_number_id !== activeInstance.id) return;
    if (messageData.lead_id !== selectedContact.id) return;

    // ✅ DEBOUNCE MAIS AGRESSIVO
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      try {
        const message = convertMessage(messageData);
        if (onNewMessage) {
          console.log('[Messages Realtime] ➕ Nova mensagem processada:', message.id);
          onNewMessage(message);
        }
      } catch (error) {
        console.error('[Messages Realtime] ❌ Erro ao processar mensagem:', error);
      }
    }, 150); // Debounce de 150ms
  }, [selectedContact?.id, activeInstance?.id, convertMessage, onNewMessage]);

  const handleMessageUpdate = useCallback((payload: any) => {
    if (!payload?.new || !selectedContact || !activeInstance || !isMountedRef.current) return;
    
    const messageData = payload.new;
    
    // ✅ FILTROS RIGOROSOS
    if (messageData.whatsapp_number_id !== activeInstance.id) return;
    if (messageData.lead_id !== selectedContact.id) return;

    try {
      const message = convertMessage(messageData);
      if (onMessageUpdate) {
        console.log('[Messages Realtime] 🔄 Mensagem atualizada:', message.id);
        onMessageUpdate(message);
      }
    } catch (error) {
      console.error('[Messages Realtime] ❌ Erro ao processar atualização:', error);
    }
  }, [selectedContact?.id, activeInstance?.id, convertMessage, onMessageUpdate]);

  // ✅ SETUP OTIMIZADO COM DEBOUNCE
  const setupRealtime = useCallback(async () => {
    if (!selectedContact || !activeInstance) {
      cleanup();
      return;
    }

    const currentConfig = `${selectedContact.id}-${activeInstance.id}`;
    const now = Date.now();
    
    // ✅ EVITAR SETUP DESNECESSÁRIO
    if (realtimeManager.currentConfig === currentConfig && realtimeManager.currentChannel) {
      console.log('[Messages Realtime] ⚠️ Configuração inalterada, mantendo canal atual');
      return;
    }
    
    // ✅ DEBOUNCE SETUP
    if (now - realtimeManager.lastSetup < 200) {
      console.log('[Messages Realtime] ⏳ Aguardando debounce...');
      return;
    }
    
    // ✅ EVITAR SETUP CONCORRENTE
    if (realtimeManager.isSettingUp) {
      console.log('[Messages Realtime] ⚠️ Setup em progresso, aguardando...');
      if (realtimeManager.setupPromise) {
        await realtimeManager.setupPromise;
      }
      return;
    }

    realtimeManager.isSettingUp = true;
    realtimeManager.lastSetup = now;
    
    console.log('[Messages Realtime] 🚀 Configurando realtime para:', {
      contactId: selectedContact.id.substring(0, 8),
      instanceId: activeInstance.id.substring(0, 8)
    });

    // Cleanup anterior
    cleanup();

    // ✅ AUTO-CLEANUP APÓS 5 MINUTOS
    realtimeManager.cleanupTimeout = setTimeout(() => {
      console.log('[Messages Realtime] ⏰ Auto-cleanup por timeout');
      cleanup();
    }, 300000);

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
          console.log('[Messages Realtime] 📡 Status:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('[Messages Realtime] ✅ Conectado com sucesso');
            isConnectedRef.current = true;
            realtimeManager.currentChannel = channel;
            realtimeManager.currentConfig = currentConfig;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('[Messages Realtime] ❌ Erro na conexão:', status);
            isConnectedRef.current = false;
            cleanup();
          } else if (status === 'CLOSED') {
            console.log('[Messages Realtime] 🔒 Canal fechado');
            isConnectedRef.current = false;
          }
        });

    } catch (error) {
      console.error('[Messages Realtime] ❌ Erro ao criar canal:', error);
      cleanup();
    } finally {
      realtimeManager.isSettingUp = false;
    }
  }, [selectedContact?.id, activeInstance?.id, handleNewMessage, handleMessageUpdate, cleanup]);

  // ✅ EFEITO PRINCIPAL COM DEBOUNCE
  useEffect(() => {
    isMountedRef.current = true;
    
    // Debounce setup para evitar múltiplas chamadas
    const setupTimer = setTimeout(() => {
      if (isMountedRef.current) {
        setupRealtime();
      }
    }, 100);

    return () => {
      clearTimeout(setupTimer);
      isMountedRef.current = false;
      
      // Limpar debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
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
    };
  }, []);

  return {
    isConnected: isConnectedRef.current
  };
};
