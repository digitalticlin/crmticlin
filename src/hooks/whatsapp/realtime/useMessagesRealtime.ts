
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
  const isConnectedRef = useRef(false);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout>();
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  
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

  // ✅ CLEANUP CONTROLADO
  const cleanup = useCallback(() => {
    console.log('[Messages Realtime] 🧹 Iniciando cleanup');
    
    // Limpar debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = undefined;
    }
    
    // Limpar timeout de cleanup
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = undefined;
    }
    
    // Remover canal com try-catch
    if (channelRef.current) {
      try {
        console.log('[Messages Realtime] 🔌 Removendo canal');
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('[Messages Realtime] ⚠️ Erro ao remover canal:', error);
      } finally {
        channelRef.current = null;
      }
    }
    
    isConnectedRef.current = false;
    console.log('[Messages Realtime] ✅ Cleanup concluído');
  }, []);

  // ✅ HANDLER PARA NOVAS MENSAGENS - OTIMIZADO
  const handleNewMessage = useCallback((payload: any) => {
    if (!payload?.new || !selectedContact || !activeInstance) return;
    
    const messageData = payload.new;
    
    // ✅ FILTROS RIGOROSOS
    if (messageData.whatsapp_number_id !== activeInstance.id) return;
    if (messageData.lead_id !== selectedContact.id) return;

    // ✅ DEBOUNCE CONTROLADO
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const message = convertMessage(messageData);
        if (onNewMessage) {
          console.log('[Messages Realtime] ➕ Nova mensagem processada');
          onNewMessage(message);
        }
      } catch (error) {
        console.error('[Messages Realtime] ❌ Erro ao processar mensagem:', error);
      }
    }, 50);
  }, [selectedContact?.id, activeInstance?.id, convertMessage, onNewMessage]);

  // ✅ HANDLER PARA MENSAGENS ATUALIZADAS - OTIMIZADO
  const handleMessageUpdate = useCallback((payload: any) => {
    if (!payload?.new || !selectedContact || !activeInstance) return;
    
    const messageData = payload.new;
    
    // ✅ FILTROS RIGOROSOS
    if (messageData.whatsapp_number_id !== activeInstance.id) return;
    if (messageData.lead_id !== selectedContact.id) return;

    try {
      const message = convertMessage(messageData);
      if (onMessageUpdate) {
        console.log('[Messages Realtime] 🔄 Mensagem atualizada');
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
    if (isConnectedRef.current && channelRef.current) {
      console.log('[Messages Realtime] ⚠️ Já conectado, reutilizando canal');
      return;
    }

    console.log('[Messages Realtime] 🚀 Configurando realtime para:', {
      contactId: selectedContact.id,
      instanceId: activeInstance.id
    });

    // Cleanup anterior
    cleanup();

    // Timeout para cleanup automático
    cleanupTimeoutRef.current = setTimeout(cleanup, 300000); // 5 minutos

    const channelId = `messages-${selectedContact.id}-${activeInstance.id}`;

    try {
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
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('[Messages Realtime] ❌ Erro na conexão:', status);
            isConnectedRef.current = false;
          } else if (status === 'CLOSED') {
            console.log('[Messages Realtime] 🔒 Canal fechado');
            isConnectedRef.current = false;
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('[Messages Realtime] ❌ Erro ao criar canal:', error);
      cleanup();
    }

    return cleanup;
  }, [selectedContact?.id, activeInstance?.id, handleNewMessage, handleMessageUpdate, cleanup]);

  // ✅ CLEANUP GERAL
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnected: isConnectedRef.current
  };
};
