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
      console.log('[Message Realtime] ⚠️ Sem contato ou instância ativa');
      return;
    }
    
    // 🚀 CORREÇÃO: Verificação mais robusta
    const messageLeadId = newMessage?.lead_id;
    const messageInstanceId = newMessage?.whatsapp_number_id;
    
    console.log('[Message Realtime] 🔍 Verificando mensagem:', {
      messageLeadId,
      selectedContactId: selectedContact.id,
      messageInstanceId, 
      activeInstanceId: activeInstance.id,
      match: messageLeadId === selectedContact.id
    });
    
    // Verificar se é mensagem do contato atual (instância será verificada pelo filtro do supabase)
    if (messageLeadId === selectedContact.id) {
      
      console.log('[Message Realtime] 📨 ✅ Nova mensagem CONFIRMADA:', {
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
        console.log('[Message Realtime] 🚀 Enviando mensagem para UI:', newMessage.id);
        onMessageUpdate(newMessage);
      }, 50); // CORREÇÃO CRÍTICA: 50ms para tempo real
    } else {
      console.log('[Message Realtime] ❌ Mensagem ignorada - contato diferente');
    }
  }, [selectedContact?.id, activeInstance?.id, onMessageUpdate, notify]);

  useEffect(() => {
    // Cleanup channel anterior se contato mudou
    if (channelRef.current && lastContactIdRef.current !== selectedContact?.id) {
      console.log('[Message Realtime] 🧹 Limpando canal anterior para contato:', lastContactIdRef.current);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    // 🚀 CORREÇÃO: Verificação separada - não bloquear se já subscrito para mesmo contato
    if (!selectedContact || !activeInstance) {
      console.log('[Message Realtime] ⚠️ Não configurando realtime: sem contato ou instância');
      return;
    }

    // Se já está subscrito para o mesmo contato, não fazer nada
    if (isSubscribedRef.current && lastContactIdRef.current === selectedContact.id) {
      console.log('[Message Realtime] ✅ Já subscrito para este contato:', selectedContact.name);
      return;
    }

    // Criar novo channel para o contato específico
    const channelId = `message-realtime-${selectedContact.id}-${activeInstance.id}-${Date.now()}`;
    
    console.log('[Message Realtime] 🚀 INICIANDO REALTIME para mensagens:', {
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
        filter: `lead_id=eq.${selectedContact.id} AND whatsapp_number_id=eq.${activeInstance.id}`
      }, (payload) => {
        console.log('[Message Realtime] 📨 INSERT recebido:', payload);
        handleMessageUpdate(payload);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `lead_id=eq.${selectedContact.id} AND whatsapp_number_id=eq.${activeInstance.id}`
      }, (payload) => {
        console.log('[Message Realtime] 🔄 UPDATE recebido:', payload);
        handleMessageUpdate(payload);
      })
      .subscribe((status) => {
        console.log('[Message Realtime] 📡 Status da subscription mudou:', status);
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
        console.log('[Message Realtime] 🛑 Desconectando realtime para:', selectedContact?.name);
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
