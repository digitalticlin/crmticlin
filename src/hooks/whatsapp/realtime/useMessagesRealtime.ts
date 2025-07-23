/**
 * 🚀 HOOK DE REALTIME PARA MENSAGENS - ISOLADO
 * 
 * Responsabilidade ÚNICA: Gerenciar updates em tempo real das mensagens
 * - Novas mensagens do contato selecionado
 * - Atualizações de status de mensagens (entregue, lida, etc.)
 * - Adicionar mensagens à lista em tempo real
 * 
 * ❌ NÃO mexe com: lista de contatos, contadores gerais
 */

import { useEffect, useRef, useCallback } from 'react';
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { supabase } from '@/integrations/supabase/client';
import { useMessageNotification } from '../chat/hooks/useMessageNotification';
import { MessagesRealtimeConfig, RealtimeConnectionStatus } from './types';
import { Message } from '@/types/chat';
import { BigQueryOptimizer } from '@/utils/immediate-bigquery-fix';

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
  
  // 🔧 REFS PARA GERENCIAMENTO DE ESTADO
  const channelRef = useRef<any>(null);
  const lastContactIdRef = useRef<string | null>(null);
  const lastInstanceIdRef = useRef<string | null>(null);
  const isSubscribedRef = useRef(false);
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statsRef = useRef({
    totalEvents: 0,
    lastUpdate: null as number | null,
    connectionStatus: 'disconnected' as RealtimeConnectionStatus
  });

  // 🧹 CLEANUP OTIMIZADO
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log('[Messages Realtime] 🧹 Removendo canal de mensagens');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
      statsRef.current.connectionStatus = 'disconnected';
    }
    
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
  }, []);

  // 💬 CONVERTER PAYLOAD PARA FORMATO MESSAGE
  const convertToMessage = useCallback((messageData: any): Message => {
    return {
      id: messageData.id,
      text: messageData.text || messageData.body || '',
      sender: messageData.from_me ? 'user' : 'contact',
      time: new Date(messageData.created_at || messageData.timestamp).toLocaleTimeString(),
      fromMe: messageData.from_me || false,
      timestamp: messageData.created_at || messageData.timestamp,
      status: messageData.status || 'sent',
      mediaType: messageData.media_type || 'text',
      mediaUrl: messageData.media_url,
      isIncoming: !messageData.from_me
    };
  }, []);

  // 📨 HANDLER PARA NOVAS MENSAGENS
  const handleNewMessage = useCallback((payload: any) => {
    try {
      const newMessage = payload.new;
      
      console.log('[Messages Realtime] 📨 Nova mensagem recebida:', {
        messageId: newMessage?.id,
        leadId: newMessage?.lead_id,
        fromMe: newMessage?.from_me,
        text: newMessage?.text?.substring(0, 30) + '...',
        instanceId: newMessage?.whatsapp_number_id
      });

      // 🔍 FILTROS RIGOROSOS
      // 1. Verificar instância ativa
      if (!activeInstance || newMessage?.whatsapp_number_id !== activeInstance.id) {
        console.log('[Messages Realtime] 🚫 Mensagem de instância diferente ignorada');
        return;
      }

      // 2. Verificar se é do contato selecionado
      if (!selectedContact || newMessage?.lead_id !== selectedContact.id) {
        console.log('[Messages Realtime] 🚫 Mensagem de contato diferente ignorada');
        return;
      }

      // ✅ MENSAGEM VÁLIDA - PROCESSAR
      statsRef.current.totalEvents++;
      statsRef.current.lastUpdate = Date.now();

      // Converter para formato Message
      const message = convertToMessage(newMessage);

      console.log('[Messages Realtime] ✅ Processando nova mensagem:', {
        messageId: message.id,
        fromMe: message.fromMe,
        text: message.text.substring(0, 50) + '...'
      });

      // Throttling para evitar spam de atualizações
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }

      throttleTimerRef.current = setTimeout(() => {
        // Callback para nova mensagem
        if (onMessageUpdate) {
          onMessageUpdate(message);
        }

        throttleTimerRef.current = null;
      }, 50); // 50ms para responsividade em tempo real

    } catch (error) {
      console.error('[Messages Realtime] ❌ Erro processando nova mensagem:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [selectedContact, activeInstance, convertToMessage, onMessageUpdate]);

  // 🔄 HANDLER PARA ATUALIZAÇÕES DE MENSAGENS
  const handleMessageUpdate = useCallback((payload: any) => {
    try {
      const updatedMessage = payload.new;
      
      console.log('[Messages Realtime] 🔄 Mensagem atualizada:', {
        messageId: updatedMessage?.id,
        leadId: updatedMessage?.lead_id,
        status: updatedMessage?.status,
        instanceId: updatedMessage?.whatsapp_number_id
      });

      // 🔍 FILTROS RIGOROSOS
      // 1. Verificar instância ativa
      if (!activeInstance || updatedMessage?.whatsapp_number_id !== activeInstance.id) {
        console.log('[Messages Realtime] 🚫 Update de instância diferente ignorado');
        return;
      }

      // 2. Verificar se é do contato selecionado
      if (!selectedContact || updatedMessage?.lead_id !== selectedContact.id) {
        console.log('[Messages Realtime] 🚫 Update de contato diferente ignorado');
        return;
      }

      // ✅ UPDATE VÁLIDO - PROCESSAR
      statsRef.current.totalEvents++;
      statsRef.current.lastUpdate = Date.now();

      // Converter para formato Message
      const message = convertToMessage(updatedMessage);

      console.log('[Messages Realtime] ✅ Processando atualização de mensagem:', {
        messageId: message.id,
        status: message.status
      });

      // Throttling para atualizações
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }

      throttleTimerRef.current = setTimeout(() => {
        // Callback de atualização
        if (onMessageUpdate) {
          onMessageUpdate(message);
        }

        throttleTimerRef.current = null;
      }, 100); // 100ms para updates (menos críticos que inserções)

    } catch (error) {
      console.error('[Messages Realtime] ❌ Erro processando atualização de mensagem:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [selectedContact, activeInstance, convertToMessage, onMessageUpdate]);

  // 🚀 CONFIGURAR SUBSCRIPTION QUANDO NECESSÁRIO
  useEffect(() => {
    // 🚀 LAZY LOADING: Verificar se deve ativar
    const shouldActivate = !!selectedContact && !!activeInstance;
    
    if (!shouldActivate) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Messages Realtime] ⚠️ Lazy loading: aguardando selectedContact e activeInstance');
      }
      // Cleanup se estava ativo antes
      cleanup();
      return;
    }

    // Verificar se precisa reconfigurar
    const needsReconfigure = 
      lastContactIdRef.current !== selectedContact?.id ||
      lastInstanceIdRef.current !== activeInstance?.id ||
      !isSubscribedRef.current;

    if (!needsReconfigure) {
      return;
    }

    // Cleanup anterior
    cleanup();

    // Atualizar refs
    lastContactIdRef.current = selectedContact?.id;
    lastInstanceIdRef.current = activeInstance?.id;

    // Criar novo canal
    const channelId = `messages-realtime-${selectedContact?.id}-${activeInstance?.id}-${Date.now()}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Messages Realtime] 🚀 Configurando subscription para mensagens:', {
        selectedContactId: selectedContact?.id,
        activeInstanceId: activeInstance?.id,
        channelId
      });
    }

    statsRef.current.connectionStatus = 'connecting';

    const channel = supabase
      .channel(channelId)
      
      // 📨 SUBSCRIPTION PARA NOVAS MENSAGENS
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `lead_id=eq.${selectedContact?.id}`
      }, handleNewMessage)
      
      // 🔄 SUBSCRIPTION PARA ATUALIZAÇÕES DE MENSAGENS
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `lead_id=eq.${selectedContact?.id}`
      }, handleMessageUpdate)
      
      .subscribe((status) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Messages Realtime] 📡 Status da subscription de mensagens:', status);
        }
        
        if (status === 'SUBSCRIBED') {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Messages Realtime] ✅ Realtime de mensagens ativo para contato:', selectedContact?.id);
          }
          isSubscribedRef.current = true;
          statsRef.current.connectionStatus = 'connected';
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Messages Realtime] ❌ Erro no canal de mensagens');
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'error';
        } else if (status === 'CLOSED') {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Messages Realtime] 🔒 Canal de mensagens fechado');
          }
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'disconnected';
        }
      });

    channelRef.current = channel;

  }, [selectedContact, activeInstance, handleNewMessage, handleMessageUpdate, cleanup]);

  // 🧹 CLEANUP GERAL
  useEffect(() => {
    return () => {
      console.log('[Messages Realtime] 🔌 Cleanup geral');
      cleanup();
    };
  }, [cleanup]);

  // 📊 RETORNAR ESTATÍSTICAS E CONTROLES
  return {
    isConnected: isSubscribedRef.current,
    connectionStatus: statsRef.current.connectionStatus,
    totalEvents: statsRef.current.totalEvents,
    lastUpdate: statsRef.current.lastUpdate,
    forceDisconnect: cleanup
  };
}; 