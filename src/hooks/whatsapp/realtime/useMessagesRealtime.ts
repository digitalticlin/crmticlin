
/**
 * 🎯 HOOK REALTIME PARA MENSAGENS - VERSÃO OTIMIZADA
 * 
 * Responsabilidade: Escutar mensagens em tempo real para contato selecionado
 * Otimizado para produção com logs reduzidos e melhor performance
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

const isProduction = process.env.NODE_ENV === 'production';

export const useMessagesRealtime = ({
  selectedContact,
  activeInstance,
  onNewMessage,
  onMessageUpdate
}: UseMessagesRealtimeProps) => {
  
  const channelRef = useRef<any>(null);
  
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

  // Cleanup otimizado
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      if (!isProduction) {
        console.log('[Messages Realtime] 🧹 Limpando canal');
      }
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Só ativar se há contato e instância selecionados
    if (!selectedContact || !activeInstance) {
      cleanup();
      return;
    }

    if (!isProduction) {
      console.log('[Messages Realtime] 🚀 Configurando realtime para:', {
        contactId: selectedContact.id,
        instanceId: activeInstance.id
      });
    }

    // Limpar canal anterior
    cleanup();

    // Criar novo canal
    const channelId = `messages-${selectedContact.id}-${activeInstance.id}-${Date.now()}`;

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `lead_id=eq.${selectedContact.id}`
      }, (payload) => {
        const messageData = payload.new;
        
        // Filtrar apenas mensagens da instância correta
        if (messageData.whatsapp_number_id !== activeInstance.id) {
          return;
        }

        const message = convertMessage(messageData);
        
        if (onNewMessage) {
          onNewMessage(message);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `lead_id=eq.${selectedContact.id}`
      }, (payload) => {
        const messageData = payload.new;
        
        // Filtrar apenas mensagens da instância correta
        if (messageData.whatsapp_number_id !== activeInstance.id) {
          return;
        }

        const message = convertMessage(messageData);
        
        if (onMessageUpdate) {
          onMessageUpdate(message);
        }
      })
      .subscribe((status) => {
        if (!isProduction) {
          console.log('[Messages Realtime] 📡 Status:', status);
        }
        
        if (status === 'SUBSCRIBED') {
          if (!isProduction) {
            console.log('[Messages Realtime] ✅ Conectado com sucesso');
          }
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
