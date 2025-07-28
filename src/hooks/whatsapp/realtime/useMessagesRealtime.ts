/**
 * 🎯 HOOK REALTIME PARA MENSAGENS - VERSÃO SIMPLES QUE FUNCIONA
 * 
 * Responsabilidade: Escutar mensagens em tempo real para contato selecionado
 * Baseado no commit 6c9daf0a que funcionava perfeitamente
 */

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

  // ✅ CLEANUP
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log('[Messages Realtime] 🧹 Limpando canal');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    // 🚫 SEM CONTATO OU INSTÂNCIA = SEM REALTIME
    if (!selectedContact || !activeInstance) {
      cleanup();
      return;
    }

    console.log('[Messages Realtime] 🚀 Configurando realtime para:', {
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
          console.log('[Messages Realtime] 📨 Nova mensagem:', payload);
          
          const messageData = payload.new;
          
          // ✅ FILTRO: Só processar se for da instância correta
          if (messageData.whatsapp_number_id !== activeInstance.id) {
            console.log('[Messages Realtime] 🚫 Mensagem de outra instância ignorada');
            return;
          }

          const message = convertMessage(messageData);
          
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
          console.log('[Messages Realtime] 🔄 Mensagem atualizada:', payload);
          
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
        console.log('[Messages Realtime] 📡 Status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('[Messages Realtime] ✅ Conectado com sucesso');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Messages Realtime] ❌ Erro na conexão:', status);
        }
      });

    channelRef.current = channel;

    return cleanup;
  }, [selectedContact, activeInstance, convertMessage, onNewMessage, onMessageUpdate, cleanup]);

  return {
    isConnected: !!channelRef.current
  };
}; 