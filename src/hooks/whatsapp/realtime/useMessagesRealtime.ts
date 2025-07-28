
/**
 * 🎯 HOOK REALTIME PARA MENSAGENS - VERSÃO OTIMIZADA FASE 1
 * 
 * NOVA FUNCIONALIDADE:
 * ✅ Comunica com useChatsRealtime para mover contatos para o topo
 * ✅ Otimização de communication layer via windowEventManager
 * 
 * Responsabilidade: Escutar mensagens em tempo real + notificar contatos
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, Message } from '../../../types/chat';
import { WhatsAppWebInstance } from '../../../types/whatsapp';
import { windowEventManager } from '@/utils/eventManager';

interface UseMessagesRealtimeProps {
  selectedContact: Contact | null;
  activeInstance: WhatsAppWebInstance | null;
  onNewMessage?: (message: Message) => void;
  onMessageUpdate?: (message: Message) => void;
  // 🚀 FASE 1: Novo callback para comunicação com contatos
  onMoveContactToTop?: (contactId: string, messageInfo: { text: string; timestamp: string; unreadCount?: number }) => void;
}

export const useMessagesRealtime = ({
  selectedContact,
  activeInstance,
  onNewMessage,
  onMessageUpdate,
  onMoveContactToTop
}: UseMessagesRealtimeProps) => {
  
  const channelRef = useRef<any>(null);
  const eventSubscriptionRef = useRef<string | null>(null);
  
  // ✅ CONVERSÃO SIMPLES DE MENSAGEM DO BANCO PARA UI
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

  // 🚀 FASE 1: Função para notificar contatos via windowEventManager
  const notifyContactUpdate = useCallback((contactId: string, messageData: any) => {
    if (onMoveContactToTop) {
      const messageInfo = {
        text: messageData.text || 'Nova mensagem',
        timestamp: messageData.created_at || new Date().toISOString(),
        unreadCount: messageData.from_me ? 0 : 1
      };
      
      console.log('[Messages Realtime] 🔔 Notificando contato para mover para o topo:', {
        contactId,
        messageInfo
      });
      
      onMoveContactToTop(contactId, messageInfo);
    }

    // 🚀 FASE 1: Dispatch evento global para outros componentes
    const eventDetail = {
      contactId,
      messageText: messageData.text || 'Nova mensagem',
      timestamp: messageData.created_at || new Date().toISOString(),
      isFromMe: messageData.from_me || false
    };

    // Dispatch do evento
    window.dispatchEvent(new CustomEvent('whatsapp-contact-update', { detail: eventDetail }));
  }, [onMoveContactToTop]);

  // ✅ CLEANUP OTIMIZADO
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log('[Messages Realtime] 🧹 Limpando canal');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // 🚀 FASE 1: Cleanup do event listener global
    if (eventSubscriptionRef.current) {
      windowEventManager.removeEventListener(eventSubscriptionRef.current);
      eventSubscriptionRef.current = null;
    }
  }, []);

  useEffect(() => {
    // 🚫 SEM CONTATO OU INSTÂNCIA = SEM REALTIME
    if (!selectedContact || !activeInstance) {
      cleanup();
      return;
    }

    console.log('[Messages Realtime] 🚀 Configurando realtime FASE 1 para:', {
      contactId: selectedContact.id,
      instanceId: activeInstance.id
    });

    // 🧹 LIMPAR CANAL ANTERIOR
    cleanup();

    // 🔌 CRIAR NOVO CANAL
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
        (payload) => {
          console.log('[Messages Realtime] 📨 Nova mensagem FASE 1:', payload);
          
          const messageData = payload.new;
          
          // ✅ FILTRO: Só processar se for da instância correta
          if (messageData.whatsapp_number_id !== activeInstance.id) {
            console.log('[Messages Realtime] 🚫 Mensagem de outra instância ignorada');
            return;
          }

          const message = convertMessage(messageData);
          
          // 🚀 FASE 1: Notificar contatos antes de adicionar mensagem
          if (!messageData.from_me) {
            notifyContactUpdate(selectedContact.id, messageData);
          }
          
          if (onNewMessage) {
            console.log('[Messages Realtime] ➕ Adicionando nova mensagem');
            onNewMessage(message);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${selectedContact.id}`
        },
        (payload) => {
          console.log('[Messages Realtime] 🔄 Mensagem atualizada FASE 1:', payload);
          
          const messageData = payload.new;
          
          // ✅ FILTRO: Só processar se for da instância correta
          if (messageData.whatsapp_number_id !== activeInstance.id) {
            return;
          }

          const message = convertMessage(messageData);
          
          if (onMessageUpdate) {
            console.log('[Messages Realtime] 🔄 Atualizando mensagem');
            onMessageUpdate(message);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Messages Realtime] 📡 Status FASE 1:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('[Messages Realtime] ✅ Conectado com sucesso FASE 1');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Messages Realtime] ❌ Erro na conexão FASE 1:', status);
        }
      });

    channelRef.current = channel;

    return cleanup;
  }, [selectedContact, activeInstance, convertMessage, onNewMessage, onMessageUpdate, cleanup, notifyContactUpdate]);

  return {
    isConnected: !!channelRef.current
  };
};
