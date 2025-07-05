import { useEffect, useRef, useCallback } from 'react';
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { supabase } from '@/integrations/supabase/client';
import { useMessageNotification } from './useMessageNotification';

interface UseMessageRealtimeProps {
  selectedContact: Contact | null;
  activeInstance: WhatsAppWebInstance | null;
  onMessageUpdate: (newMessage?: any) => void;
}

export const useMessageRealtime = ({
  selectedContact,
  activeInstance,
  onMessageUpdate
}: UseMessageRealtimeProps) => {
  const channelRef = useRef<any>(null);
  const lastContactIdRef = useRef<string | null>(null);
  const isSubscribedRef = useRef(false);
  const updateThrottleRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hook de notificação
  const { notify } = useMessageNotification({
    contactName: selectedContact?.name || 'Contato',
    enabled: !!selectedContact
  });
  
  // Callback otimizado com throttling rigoroso
  const handleMessageUpdate = useCallback((payload: any) => {
    const newMessage = payload.new;
    
    if (!selectedContact || !activeInstance) {
      return;
    }
    
    // Verificar se é mensagem do contato atual
    if (newMessage?.lead_id === selectedContact.id && 
        newMessage?.whatsapp_number_id === activeInstance.id) {
      
      console.log('[Message Realtime] 📨 Nova mensagem detectada:', {
        leadId: newMessage.lead_id,
        text: newMessage.text?.substring(0, 50) + '...',
        fromMe: newMessage.from_me
      });
      
      // Notificar apenas mensagens recebidas
      if (!newMessage.from_me && newMessage.text) {
        notify(newMessage.text);
      }
      
      // Throttling otimizado para melhor responsividade
      if (updateThrottleRef.current) {
        clearTimeout(updateThrottleRef.current);
      }
      
      updateThrottleRef.current = setTimeout(() => {
        onMessageUpdate(newMessage);
      }, 300); // Reduzido para 300ms para melhor UX
    }
  }, [selectedContact?.id, activeInstance?.id, onMessageUpdate, notify]);

  useEffect(() => {
    // Cleanup channel anterior se contato mudou
    if (channelRef.current && lastContactIdRef.current !== selectedContact?.id) {
      console.log('[Message Realtime] 🧹 Limpando canal anterior');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    if (!selectedContact || !activeInstance || isSubscribedRef.current) {
      return;
    }

    // Criar novo channel para o contato específico
    const channelId = `message-realtime-${selectedContact.id}-${activeInstance.id}-${Date.now()}`;
    
    console.log('[Message Realtime] 🚀 Iniciando realtime para:', {
      contactId: selectedContact.id,
      contactName: selectedContact.name,
      instanceId: activeInstance.id,
      channelId
    });
    
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `lead_id=eq.${selectedContact.id}`
      }, handleMessageUpdate)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `lead_id=eq.${selectedContact.id}`
      }, handleMessageUpdate)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Message Realtime] ✅ Realtime ativo para:', selectedContact.name);
          isSubscribedRef.current = true;
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Message Realtime] ❌ Erro no canal realtime');
          isSubscribedRef.current = false;
        } else if (status === 'CLOSED') {
          console.log('[Message Realtime] 🔒 Canal fechado');
          isSubscribedRef.current = false;
        }
      });
    
    channelRef.current = channel;
    lastContactIdRef.current = selectedContact.id;

    // Cleanup ao desmontar ou mudar dependências
    return () => {
      if (channelRef.current) {
        console.log('[Message Realtime] 🛑 Desconectando realtime');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
      
      if (updateThrottleRef.current) {
        clearTimeout(updateThrottleRef.current);
        updateThrottleRef.current = null;
      }
    };
  }, [selectedContact?.id, activeInstance?.id, handleMessageUpdate]);

  // Cleanup geral no unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
      
      if (updateThrottleRef.current) {
        clearTimeout(updateThrottleRef.current);
        updateThrottleRef.current = null;
      }
    };
  }, []);
};
