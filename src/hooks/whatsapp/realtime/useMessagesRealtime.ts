
/**
 * 🎯 HOOK REALTIME OTIMIZADO PARA MÍDIA
 * 
 * MELHORIAS:
 * ✅ Suporte completo à mídia (media_cache incluído)
 * ✅ Conversão otimizada com dados de mídia
 * ✅ Filtros inteligentes para evitar duplicação
 * ✅ Logs reduzidos para produção
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, Message } from '../../../types/chat';
import { WhatsAppWebInstance } from '../../../types/whatsapp';
import { useAuth } from '@/contexts/AuthContext';

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
  
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());
  
  // ✅ CONVERSÃO OTIMIZADA COM SUPORTE COMPLETO À MÍDIA
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
      // ✅ INCLUIR DADOS COMPLETOS DE MÍDIA
      media_cache: messageData.media_cache || null,
      hasMediaCache: !!messageData.media_cache,
      mediaCacheId: messageData.media_cache?.id || undefined
    } satisfies Message;
  }, []);

  // ✅ FILTRO INTELIGENTE PARA EVITAR DUPLICAÇÃO
  const shouldProcessMessage = useCallback((messageData: any): boolean => {
    // Verificar se já foi processada
    if (processedMessageIds.current.has(messageData.id)) {
      if (!isProduction) {
        console.log(`[MessagesRealtime] 🚫 Mensagem já processada: ${messageData.id}`);
      }
      return false;
    }

    // ✅ FILTRO PRINCIPAL: Mensagens próprias são tratadas localmente via UI otimista
    if (messageData.from_me) {
      if (!isProduction) {
        console.log(`[MessagesRealtime] 🚫 Mensagem própria ignorada: ${messageData.id}`);
      }
      return false;
    }

    // ✅ FILTRO SECUNDÁRIO: Apenas mensagens da instância correta
    if (messageData.whatsapp_number_id !== activeInstance?.id) {
      return false;
    }

    // ✅ FILTRO TERCIÁRIO: Apenas mensagens do contato selecionado
    if (messageData.lead_id !== selectedContact?.id) {
      return false;
    }

    // Marcar como processada
    processedMessageIds.current.add(messageData.id);
    return true;
  }, [selectedContact, activeInstance]);

  // Cleanup otimizado
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      if (!isProduction) {
        console.log('[MessagesRealtime] 🧹 Limpando canal realtime');
      }
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    // Limpar cache de mensagens processadas
    processedMessageIds.current.clear();
  }, []);

  useEffect(() => {
    // Só ativar se há contato e instância selecionados
    if (!selectedContact || !activeInstance || !user) {
      cleanup();
      return;
    }

    if (!isProduction) {
      console.log('[MessagesRealtime] 🚀 Configurando realtime para mídia:', {
        contactId: selectedContact.id,
        instanceId: activeInstance.id
      });
    }

    // Limpar canal anterior
    cleanup();

    // Criar novo canal com timestamp único
    const channelId = `messages-media-${selectedContact.id}-${activeInstance.id}-${Date.now()}`;

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `lead_id=eq.${selectedContact.id}`
      }, (payload) => {
        const messageData = payload.new;
        
        if (!shouldProcessMessage(messageData)) {
          return;
        }

        const message = convertMessage(messageData);
        
        if (!isProduction) {
          console.log('[MessagesRealtime] 📨 Nova mensagem externa (com mídia):', {
            messageId: message.id,
            fromMe: message.fromMe,
            mediaType: message.mediaType || 'text',
            hasMediaCache: message.hasMediaCache,
            text: message.text.substring(0, 50) + '...'
          });
        }
        
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
        
        // Para updates, permitir mensagens próprias (mudança de status)
        if (messageData.whatsapp_number_id !== activeInstance.id) {
          return;
        }

        const message = convertMessage(messageData);
        
        if (!isProduction) {
          console.log('[MessagesRealtime] 🔄 Mensagem atualizada (com mídia):', {
            messageId: message.id,
            fromMe: message.fromMe,
            status: message.status,
            mediaType: message.mediaType || 'text',
            hasMediaCache: message.hasMediaCache
          });
        }
        
        if (onMessageUpdate) {
          onMessageUpdate(message);
        }
      })
      .subscribe((status) => {
        if (!isProduction) {
          console.log('[MessagesRealtime] 📡 Status conexão:', status);
        }
        
        if (status === 'SUBSCRIBED') {
          if (!isProduction) {
            console.log('[MessagesRealtime] ✅ Realtime conectado com suporte à mídia');
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[MessagesRealtime] ❌ Erro na conexão realtime:', status);
        }
      });

    channelRef.current = channel;

    return cleanup;
  }, [selectedContact, activeInstance, user, convertMessage, onNewMessage, onMessageUpdate, cleanup, shouldProcessMessage]);

  return {
    isConnected: !!channelRef.current
  };
};
