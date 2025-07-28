
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

// ✅ SINGLETON OTIMIZADO PARA MELHOR PERFORMANCE
const realtimeManager = {
  currentChannel: null as any,
  currentConfig: '',
  isSettingUp: false,
  lastSetup: 0,
  cleanupTimeout: null as NodeJS.Timeout | null,
  heartbeatInterval: null as NodeJS.Timeout | null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 10,
  eventQueue: [] as Array<{ type: string; payload: any; timestamp: number }>
};

export const useMessagesRealtime = ({
  selectedContact,
  activeInstance,
  onNewMessage,
  onMessageUpdate
}: UseMessagesRealtimeProps) => {
  
  const isConnectedRef = useRef(false);
  const isMountedRef = useRef(true);
  const eventProcessingRef = useRef(false);
  
  // ✅ CONVERSÃO OTIMIZADA DE MENSAGEM
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

  // ✅ PROCESSAMENTO DE FILA OTIMIZADO - DEBOUNCE REDUZIDO
  const processEventQueue = useCallback(async () => {
    if (eventProcessingRef.current || realtimeManager.eventQueue.length === 0) return;
    
    eventProcessingRef.current = true;
    
    try {
      const events = realtimeManager.eventQueue.splice(0, 5); // Processar 5 eventos por vez
      
      for (const event of events) {
        if (!isMountedRef.current) break;
        
        const { type, payload } = event;
        
        try {
          const message = convertMessage(payload.new);
          
          if (type === 'INSERT') {
            console.log('[Messages Realtime] 📨 Nova mensagem (INSERT):', message.id);
            onNewMessage?.(message);
          } else if (type === 'UPDATE') {
            console.log('[Messages Realtime] 🔄 Mensagem atualizada (UPDATE):', message.id);
            onMessageUpdate?.(message);
          }
        } catch (error) {
          console.error('[Messages Realtime] ❌ Erro ao processar evento:', error);
        }
      }
    } finally {
      eventProcessingRef.current = false;
      
      // ✅ CONTINUAR PROCESSANDO SE HOUVER MAIS EVENTOS
      if (realtimeManager.eventQueue.length > 0) {
        setTimeout(processEventQueue, 10);
      }
    }
  }, [convertMessage, onNewMessage, onMessageUpdate]);

  // ✅ HANDLER OTIMIZADO PARA NOVA MENSAGEM (INSERT) - DEBOUNCE 50MS
  const handleNewMessage = useCallback((payload: any) => {
    if (!payload?.new || !selectedContact || !activeInstance || !isMountedRef.current) return;
    
    const messageData = payload.new;
    
    // ✅ FILTROS RIGOROSOS
    if (messageData.whatsapp_number_id !== activeInstance.id) return;
    if (messageData.lead_id !== selectedContact.id) return;

    // ✅ ADICIONAR À FILA COM DEBOUNCE REDUZIDO
    realtimeManager.eventQueue.push({
      type: 'INSERT',
      payload,
      timestamp: Date.now()
    });
    
    setTimeout(processEventQueue, 50); // Reduzido de 150ms para 50ms
  }, [selectedContact?.id, activeInstance?.id, processEventQueue]);

  // ✅ HANDLER OTIMIZADO PARA ATUALIZAÇÃO (UPDATE) - SEM DEBOUNCE
  const handleMessageUpdate = useCallback((payload: any) => {
    if (!payload?.new || !selectedContact || !activeInstance || !isMountedRef.current) return;
    
    const messageData = payload.new;
    
    // ✅ FILTROS RIGOROSOS
    if (messageData.whatsapp_number_id !== activeInstance.id) return;
    if (messageData.lead_id !== selectedContact.id) return;

    // ✅ PROCESSAR IMEDIATAMENTE (SEM DEBOUNCE)
    realtimeManager.eventQueue.push({
      type: 'UPDATE',
      payload,
      timestamp: Date.now()
    });
    
    processEventQueue(); // Sem delay para updates
  }, [selectedContact?.id, activeInstance?.id, processEventQueue]);

  // ✅ HEARTBEAT OTIMIZADO - 30 SEGUNDOS
  const setupHeartbeat = useCallback(() => {
    if (realtimeManager.heartbeatInterval) {
      clearInterval(realtimeManager.heartbeatInterval);
    }
    
    realtimeManager.heartbeatInterval = setInterval(() => {
      if (realtimeManager.currentChannel && isConnectedRef.current) {
        try {
          // ✅ PING SIMPLES PARA MANTER CONEXÃO
          realtimeManager.currentChannel.send({
            type: 'heartbeat',
            timestamp: Date.now()
          });
          console.log('[Messages Realtime] 💗 Heartbeat enviado');
        } catch (error) {
          console.warn('[Messages Realtime] ⚠️ Heartbeat falhou:', error);
        }
      }
    }, 30000); // 30 segundos
  }, []);

  // ✅ CLEANUP OTIMIZADO
  const cleanup = useCallback(() => {
    if (realtimeManager.cleanupTimeout) {
      clearTimeout(realtimeManager.cleanupTimeout);
      realtimeManager.cleanupTimeout = null;
    }
    
    if (realtimeManager.heartbeatInterval) {
      clearInterval(realtimeManager.heartbeatInterval);
      realtimeManager.heartbeatInterval = null;
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
        realtimeManager.reconnectAttempts = 0;
        realtimeManager.eventQueue = [];
        isConnectedRef.current = false;
        console.log('[Messages Realtime] ✅ Cleanup concluído');
      }
    }
  }, []);

  // ✅ SETUP COM RETRY EXPONENCIAL OTIMIZADO
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
    
    // ✅ DEBOUNCE REDUZIDO
    if (now - realtimeManager.lastSetup < 50) {
      console.log('[Messages Realtime] ⏳ Aguardando debounce...');
      return;
    }
    
    // ✅ EVITAR SETUP CONCORRENTE
    if (realtimeManager.isSettingUp) {
      console.log('[Messages Realtime] ⚠️ Setup em progresso, aguardando...');
      return;
    }

    realtimeManager.isSettingUp = true;
    realtimeManager.lastSetup = now;
    
    console.log('[Messages Realtime] 🚀 Configurando realtime otimizado para:', {
      contactId: selectedContact.id.substring(0, 8),
      instanceId: activeInstance.id.substring(0, 8),
      attempt: realtimeManager.reconnectAttempts + 1
    });

    // Cleanup anterior
    cleanup();

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
          console.log('[Messages Realtime] 📡 Status otimizado:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('[Messages Realtime] ✅ Conectado com sucesso - Performance otimizada');
            isConnectedRef.current = true;
            realtimeManager.currentChannel = channel;
            realtimeManager.currentConfig = currentConfig;
            realtimeManager.reconnectAttempts = 0;
            setupHeartbeat();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('[Messages Realtime] ❌ Erro na conexão:', status);
            isConnectedRef.current = false;
            
            // ✅ RETRY EXPONENCIAL OTIMIZADO
            if (realtimeManager.reconnectAttempts < realtimeManager.maxReconnectAttempts) {
              const delay = Math.min(1000 * Math.pow(2, realtimeManager.reconnectAttempts), 30000);
              realtimeManager.reconnectAttempts++;
              
              console.log(`[Messages Realtime] 🔄 Tentando reconectar em ${delay}ms (tentativa ${realtimeManager.reconnectAttempts})`);
              
              setTimeout(() => {
                if (isMountedRef.current) {
                  setupRealtime();
                }
              }, delay);
            } else {
              console.error('[Messages Realtime] ❌ Limite de tentativas de reconexão atingido');
              cleanup();
            }
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
  }, [selectedContact?.id, activeInstance?.id, handleNewMessage, handleMessageUpdate, cleanup, setupHeartbeat]);

  // ✅ EFEITO PRINCIPAL OTIMIZADO
  useEffect(() => {
    isMountedRef.current = true;
    
    const setupTimer = setTimeout(() => {
      if (isMountedRef.current) {
        setupRealtime();
      }
    }, 25); // Reduzido de 50ms para 25ms

    return () => {
      clearTimeout(setupTimer);
      isMountedRef.current = false;
    };
  }, [setupRealtime]);

  // ✅ CLEANUP FINAL
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnected: isConnectedRef.current,
    reconnectAttempts: realtimeManager.reconnectAttempts
  };
};
