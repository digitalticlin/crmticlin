
/**
 * 🚀 HOOK DE REALTIME PARA MENSAGENS INDIVIDUAIS - ISOLADO
 * 
 * Responsabilidade ÚNICA: Gerenciar updates em tempo real de mensagens específicas
 * - Novas mensagens em conversas abertas
 * - Atualização de status de mensagens (lida, entregue, etc.)
 * - Sincronização de mídia
 * 
 * ❌ NÃO mexe com: lista de contatos, contadores globais
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessagesRealtimeConfig, RealtimeConnectionStatus } from './types';
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
  }, []);

  // 💬 HANDLER PARA NOVAS MENSAGENS
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

      // Verificar se é da conversa ativa e instância correta
      if (selectedContactId && 
          activeInstanceId && 
          newMessage?.lead_id === selectedContactId &&
          newMessage?.whatsapp_number_id === activeInstanceId) {
        
        statsRef.current.totalEvents++;
        statsRef.current.lastUpdate = Date.now();

        // Notificar nova mensagem
        if (onNewMessage) {
          onNewMessage(newMessage);
        }

        // Refresh da lista se necessário
        if (onMessagesRefresh) {
          setTimeout(() => onMessagesRefresh(), 100);
        }
      }
    } catch (error) {
      console.error('[Messages Realtime] ❌ Erro processando nova mensagem:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [selectedContactId, activeInstanceId, onNewMessage, onMessagesRefresh]);

  // 📝 HANDLER PARA ATUALIZAÇÃO DE MENSAGENS
  const handleMessageUpdate = useCallback((payload: any) => {
    try {
      const updatedMessage = payload.new;
      
      console.log('[Messages Realtime] 📝 Mensagem atualizada:', {
        messageId: updatedMessage?.id,
        leadId: updatedMessage?.lead_id,
        status: updatedMessage?.status
      });

      // Verificar se é da conversa ativa e instância correta
      if (selectedContactId && 
          activeInstanceId && 
          updatedMessage?.lead_id === selectedContactId &&
          updatedMessage?.whatsapp_number_id === activeInstanceId) {
        
        statsRef.current.totalEvents++;
        statsRef.current.lastUpdate = Date.now();

        // Notificar atualização
        if (onMessageUpdate) {
          onMessageUpdate(updatedMessage);
        }
      }
    } catch (error) {
      console.error('[Messages Realtime] ❌ Erro processando atualização de mensagem:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [selectedContactId, activeInstanceId, onMessageUpdate]);

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
      
      // 💬 SUBSCRIPTION PARA NOVAS MENSAGENS
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `lead_id=eq.${selectedContactId}`
      }, handleNewMessage)
      
      // 📝 SUBSCRIPTION PARA ATUALIZAÇÕES DE MENSAGENS
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `lead_id=eq.${selectedContactId}`
      }, handleMessageUpdate)
      
      .subscribe((status) => {
        console.log('[Messages Realtime] 📡 Status da subscription de mensagens:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('[Messages Realtime] ✅ Realtime de mensagens ativo');
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
