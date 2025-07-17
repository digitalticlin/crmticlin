/**
 * 🚀 HOOK DE REALTIME PARA CHATS/CONTATOS - ISOLADO
 * 
 * Responsabilidade ÚNICA: Gerenciar updates em tempo real da lista de contatos
 * - Novos contatos (leads)
 * - Atualização de contadores de mensagens não lidas
 * - Mover contatos para topo quando recebem mensagens
 * 
 * ❌ NÃO mexe com: mensagens individuais, conteúdo de chat
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatsRealtimeConfig, RealtimeConnectionStatus } from './types';
import { BigQueryOptimizer } from '@/utils/immediate-bigquery-fix';

export const useChatsRealtime = ({
  userId,
  activeInstanceId,
  onContactUpdate,
  onNewContact,
  onContactsRefresh
}: ChatsRealtimeConfig) => {
  
  // 🔧 REFS PARA GERENCIAMENTO DE ESTADO
  const channelRef = useRef<any>(null);
  const lastUserIdRef = useRef<string | null>(null);
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
      console.log('[Chats Realtime] 🧹 Removendo canal de chats');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
      statsRef.current.connectionStatus = 'disconnected';
    }
  }, []);

  // 📨 HANDLER PARA NOVOS LEADS
  const handleNewLead = useCallback((payload: any) => {
    try {
      const newLead = payload.new;
      
      console.log('[Chats Realtime] 👤 Novo lead recebido:', {
        leadId: newLead?.id,
        name: newLead?.name,
        instanceId: newLead?.whatsapp_number_id
      });

      // Verificar se é da instância ativa
      if (activeInstanceId && newLead?.whatsapp_number_id === activeInstanceId) {
        statsRef.current.totalEvents++;
        statsRef.current.lastUpdate = Date.now();

        // Notificar novo contato se callback fornecido
        if (onNewContact && newLead) {
          // Converter para formato Contact se necessário
          const contactData = {
            id: newLead.id,
            name: newLead.name || 'Sem nome',
            phone: newLead.phone || '',
            leadId: newLead.id,
            // Outros campos serão preenchidos pelo refresh
          };
          onNewContact(contactData as any);
        }

        // Refresh suave da lista de contatos (sem resetar paginação)
        if (onContactsRefresh) {
          setTimeout(() => onContactsRefresh(), 300);
        }
      }
    } catch (error) {
      console.error('[Chats Realtime] ❌ Erro processando novo lead:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [activeInstanceId, onNewContact, onContactsRefresh]);

  // 📝 HANDLER PARA ATUALIZAÇÃO DE LEADS
  const handleLeadUpdate = useCallback((payload: any) => {
    try {
      const updatedLead = payload.new;
      
      console.log('[Chats Realtime] 📝 Lead atualizado:', {
        leadId: updatedLead?.id,
        name: updatedLead?.name,
        instanceId: updatedLead?.whatsapp_number_id
      });

      // Verificar se é da instância ativa
      if (activeInstanceId && updatedLead?.whatsapp_number_id === activeInstanceId) {
        statsRef.current.totalEvents++;
        statsRef.current.lastUpdate = Date.now();

        // Updates de leads são menos críticos que novas mensagens
        // Apenas log para debug - refresh manual se necessário
      }
    } catch (error) {
      console.error('[Chats Realtime] ❌ Erro processando atualização de lead:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [activeInstanceId]);

  // 💬 HANDLER PARA NOVAS MENSAGENS (move contato para topo)
  const handleNewMessage = useCallback((payload: any) => {
    try {
      const newMessage = payload.new;
      
      console.log('[Chats Realtime] 💬 Nova mensagem (mover contato):', {
        leadId: newMessage?.lead_id,
        fromMe: newMessage?.from_me,
        text: newMessage?.text?.substring(0, 30) + '...',
        instanceId: newMessage?.whatsapp_number_id
      });

      // Verificar se é da instância ativa
      if (activeInstanceId && newMessage?.whatsapp_number_id === activeInstanceId) {
        statsRef.current.totalEvents++;
        statsRef.current.lastUpdate = Date.now();

        const leadId = newMessage.lead_id;
        const messageText = newMessage.text || newMessage.body || '';

        // Mover contato para topo (apenas se não for mensagem enviada por nós)
        if (leadId && !newMessage.from_me && onContactUpdate) {
          console.log('[Chats Realtime] 🔝 Movendo contato para topo:', leadId);
          onContactUpdate(leadId, messageText);
        }
      }
    } catch (error) {
      console.error('[Chats Realtime] ❌ Erro processando nova mensagem:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [activeInstanceId, onContactUpdate]);

  // 🚀 CONFIGURAR SUBSCRIPTION QUANDO NECESSÁRIO
  useEffect(() => {
    // Verificar se precisa reconfigurar
    const needsReconfigure = 
      lastUserIdRef.current !== userId ||
      lastInstanceIdRef.current !== activeInstanceId ||
      !isSubscribedRef.current;

    if (!needsReconfigure) {
      return;
    }

    // Cleanup anterior
    cleanup();

    // Verificar pré-requisitos
    if (!userId || !activeInstanceId) {
      console.log('[Chats Realtime] ⚠️ Pré-requisitos não atendidos:', {
        userId: !!userId,
        activeInstanceId: !!activeInstanceId
      });
      return;
    }

    // Atualizar refs
    lastUserIdRef.current = userId;
    lastInstanceIdRef.current = activeInstanceId;

    // Criar novo canal
    const channelId = `chats-realtime-${userId}-${activeInstanceId}-${Date.now()}`;
    
    console.log('[Chats Realtime] 🚀 Configurando subscription para chats:', {
      userId,
      activeInstanceId,
      channelId
    });

    statsRef.current.connectionStatus = 'connecting';

    const channel = supabase
      .channel(channelId)
      
      // 👤 SUBSCRIPTION PARA NOVOS LEADS
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leads',
        filter: `whatsapp_number_id=eq.${activeInstanceId}`
      }, handleNewLead)
      
      // 📝 SUBSCRIPTION PARA ATUALIZAÇÕES DE LEADS
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'leads',
        filter: `whatsapp_number_id=eq.${activeInstanceId}`
      }, handleLeadUpdate)
      
      // 💬 SUBSCRIPTION PARA NOVAS MENSAGENS (move contato para topo)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `whatsapp_number_id=eq.${activeInstanceId}`
      }, handleNewMessage)
      
      .subscribe((status) => {
        console.log('[Chats Realtime] 📡 Status da subscription de chats:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('[Chats Realtime] ✅ Realtime de chats ativo');
          isSubscribedRef.current = true;
          statsRef.current.connectionStatus = 'connected';
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Chats Realtime] ❌ Erro no canal de chats');
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'error';
        } else if (status === 'CLOSED') {
          console.log('[Chats Realtime] 🔒 Canal de chats fechado');
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'disconnected';
        }
      });

    channelRef.current = channel;

  }, [userId, activeInstanceId, handleNewLead, handleLeadUpdate, handleNewMessage, cleanup]);

  // 🧹 CLEANUP GERAL
  useEffect(() => {
    return () => {
      console.log('[Chats Realtime] 🔌 Cleanup geral');
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