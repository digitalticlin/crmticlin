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
import { supabase } from '@/integrations/supabase/client';
import { MessagesRealtimeConfig, RealtimeConnectionStatus } from './types';
import { Message } from '@/types/chat';
import { BigQueryOptimizer } from '@/utils/immediate-bigquery-fix';

export const useMessagesRealtime = ({
  selectedContactId,
  activeInstanceId,
  onMessageUpdate,
  onNewMessage,
  onMessagesRefresh
}: MessagesRealtimeConfig) => {
  
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
      if (!activeInstanceId || newMessage?.whatsapp_number_id !== activeInstanceId) {
        console.log('[Messages Realtime] 🚫 Mensagem de instância diferente ignorada');
        return;
      }

      // 2. Verificar se é do contato selecionado
      if (!selectedContactId || newMessage?.lead_id !== selectedContactId) {
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
        if (onNewMessage) {
          onNewMessage(message);
        }

        // Callback genérico de atualização
        if (onMessageUpdate) {
          onMessageUpdate(message);
        }

        throttleTimerRef.current = null;
      }, 50); // 50ms para responsividade em tempo real

    } catch (error) {
      console.error('[Messages Realtime] ❌ Erro processando nova mensagem:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [selectedContactId, activeInstanceId, convertToMessage, onNewMessage, onMessageUpdate]);

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
      if (!activeInstanceId || updatedMessage?.whatsapp_number_id !== activeInstanceId) {
        console.log('[Messages Realtime] 🚫 Update de instância diferente ignorado');
        return;
      }

      // 2. Verificar se é do contato selecionado
      if (!selectedContactId || updatedMessage?.lead_id !== selectedContactId) {
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
  }, [selectedContactId, activeInstanceId, convertToMessage, onMessageUpdate]);

  // 🚀 CONFIGURAR SUBSCRIPTION QUANDO NECESSÁRIO
  useEffect(() => {
    // Verificar se precisa reconfigurar
    const needsReconfigure = 
      lastContactIdRef.current !== selectedContactId ||
      lastInstanceIdRef.current !== activeInstanceId ||
      !isSubscribedRef.current;

    if (!needsReconfigure) {
      return;
    }

    // Cleanup anterior
    cleanup();

    // Verificar pré-requisitos
    if (!selectedContactId || !activeInstanceId) {
      console.log('[Messages Realtime] ⚠️ Pré-requisitos não atendidos:', {
        selectedContactId: !!selectedContactId,
        activeInstanceId: !!activeInstanceId
      });
      return;
    }

    // Atualizar refs
    lastContactIdRef.current = selectedContactId;
    lastInstanceIdRef.current = activeInstanceId;

    // Criar novo canal
    const channelId = `messages-realtime-${selectedContactId}-${activeInstanceId}-${Date.now()}`;
    
    console.log('[Messages Realtime] 🚀 Configurando subscription para mensagens:', {
      selectedContactId,
      activeInstanceId,
      channelId
    });

    statsRef.current.connectionStatus = 'connecting';

    const channel = supabase
      .channel(channelId)
      
      // 📨 SUBSCRIPTION PARA NOVAS MENSAGENS
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `lead_id=eq.${selectedContactId}`
      }, handleNewMessage)
      
      // 🔄 SUBSCRIPTION PARA ATUALIZAÇÕES DE MENSAGENS
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `lead_id=eq.${selectedContactId}`
      }, handleMessageUpdate)
      
      .subscribe((status) => {
        console.log('[Messages Realtime] 📡 Status da subscription de mensagens:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('[Messages Realtime] ✅ Realtime de mensagens ativo para contato:', selectedContactId);
          isSubscribedRef.current = true;
          statsRef.current.connectionStatus = 'connected';
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Messages Realtime] ❌ Erro no canal de mensagens');
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'error';
        } else if (status === 'CLOSED') {
          console.log('[Messages Realtime] 🔒 Canal de mensagens fechado');
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'disconnected';
        }
      });

    channelRef.current = channel;

  }, [selectedContactId, activeInstanceId, handleNewMessage, handleMessageUpdate, cleanup]);

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