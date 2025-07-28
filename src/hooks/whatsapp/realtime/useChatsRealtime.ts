
/**
 * 🎯 HOOK ISOLADO: REALTIME PARA CARDS DE CONTATOS - OTIMIZADO FASE 1
 * 
 * OTIMIZAÇÕES FASE 1:
 * ✅ Melhor comunicação com useMessagesRealtime
 * ✅ Uso do windowEventManager para eventos globais
 * ✅ Callbacks granulares mais eficientes
 * ✅ Redução de subscriptions desnecessárias
 * 
 * RESPONSABILIDADE ÚNICA: Atualizar lista de contatos em tempo real
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatsRealtimeConfig, RealtimeConnectionStatus } from './types';
import { BigQueryOptimizer } from '@/utils/immediate-bigquery-fix';
import { realtimeLogger } from '@/utils/logger';
import { windowEventManager } from '@/utils/eventManager';

export const useChatsRealtime = ({
  userId,
  activeInstanceId,
  onContactUpdate,
  onNewContact,
  onContactsRefresh,
  onMoveContactToTop,
  onUpdateUnreadCount,
  onAddNewContact
}: ChatsRealtimeConfig) => {
  
  // 🚀 FASE 1: Refs para otimização
  const channelRef = useRef<any>(null);
  const eventSubscriptionRef = useRef<string | null>(null);
  const lastUserIdRef = useRef<string | null>(null);
  const lastInstanceIdRef = useRef<string | null>(null);
  const isSubscribedRef = useRef(false);
  
  const statsRef = useRef({
    totalEvents: 0,
    lastUpdate: null as number | null,
    connectionStatus: 'disconnected' as RealtimeConnectionStatus
  });

  // 🧹 CLEANUP OTIMIZADO FASE 1
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      realtimeLogger.log('🧹 Removendo canal de chats FASE 1');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
      statsRef.current.connectionStatus = 'disconnected';
    }

    // 🚀 FASE 1: Cleanup do event listener global
    if (eventSubscriptionRef.current) {
      windowEventManager.removeEventListener(eventSubscriptionRef.current);
      eventSubscriptionRef.current = null;
    }
  }, []);

  // 🚀 FASE 1: Handler para eventos globais de mensagens
  const handleGlobalMessageEvent = useCallback((event: CustomEvent) => {
    const { contactId, messageText, timestamp, isFromMe } = event.detail;
    
    if (isFromMe) {
      console.log('[Chats Realtime] 📤 Mensagem própria ignorada para contato:', contactId);
      return;
    }

    console.log('[Chats Realtime] 🔔 Evento global recebido FASE 1:', {
      contactId,
      messageText,
      timestamp
    });

    // 🚀 PRIORIZAR: Callback granular para mover contato para o topo
    if (onMoveContactToTop) {
      const messageInfo = {
        text: messageText,
        timestamp,
        unreadCount: 1
      };
      
      console.log('[Chats Realtime] 📍 Movendo contato para o topo via evento global:', {
        contactId,
        messageInfo
      });
      
      onMoveContactToTop(contactId, messageInfo);
      return; // ✅ EVITAR outros callbacks se este existir
    }

    // Fallback para callbacks legados
    if (onContactUpdate) {
      onContactUpdate(contactId, messageText);
    }
  }, [onMoveContactToTop, onContactUpdate]);

  // 👤 HANDLER PARA NOVOS LEADS (MANTIDO IGUAL)
  const handleNewLead = useCallback((payload: any) => {
    try {
      const newLead = payload.new;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Chats Realtime] 👤 Novo lead detectado FASE 1:', {
          leadId: newLead?.id,
          name: newLead?.name,
          phone: newLead?.phone,
          instanceId: newLead?.whatsapp_number_id
        });
      }

      // Verificar se é da instância ativa
      if (activeInstanceId && newLead?.whatsapp_number_id === activeInstanceId) {
        statsRef.current.totalEvents++;
        statsRef.current.lastUpdate = Date.now();

        // 🚀 PRIORIZAR: Callback granular para adicionar novo contato
        if (onAddNewContact) {
          const newContactData = {
            id: newLead.id,
            leadId: newLead.id,
            name: newLead.name || 'Novo Contato',
            phone: newLead.phone,
            email: newLead.email,
            lastMessage: 'Nova conversa iniciada',
            lastMessageTime: newLead.created_at || new Date().toISOString(),
            unreadCount: 1,
            stageId: newLead.kanban_stage_id || null,
            createdAt: newLead.created_at
          };
          
          console.log('[Chats Realtime] ➕ Adicionando novo contato via callback granular FASE 1');
          onAddNewContact(newContactData);
          return;
        }

        // Fallback: Callbacks legados
        if (onNewContact) {
          const contact = {
            id: newLead.id,
            name: newLead.name || newLead.phone || 'Contato',
            phone: newLead.phone
          };
          onNewContact(contact);
        }

        // Último recurso: Refresh completo
        if (onContactsRefresh && !onAddNewContact) {
          console.log('[Chats Realtime] 🔄 Fallback: refresh completo para novo lead FASE 1');
          onContactsRefresh();
        }
      }
    } catch (error) {
      console.error('[Chats Realtime] ❌ Erro processando novo lead FASE 1:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [activeInstanceId, onNewContact, onContactsRefresh, onAddNewContact]);

  // 📝 HANDLER PARA ATUALIZAÇÕES DE LEADS (MANTIDO IGUAL)
  const handleLeadUpdate = useCallback((payload: any) => {
    try {
      const updatedLead = payload.new;
      const oldLead = payload.old;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Chats Realtime] 📝 Lead atualizado FASE 1:', {
          leadId: updatedLead?.id,
          name: updatedLead?.name,
          oldUnreadCount: oldLead?.unread_count,
          newUnreadCount: updatedLead?.unread_count,
          instanceId: updatedLead?.whatsapp_number_id
        });
      }

      // Verificar se é da instância ativa
      if (activeInstanceId && updatedLead?.whatsapp_number_id === activeInstanceId) {
        statsRef.current.totalEvents++;
        statsRef.current.lastUpdate = Date.now();

        // 🚀 PRIORIZAR: Callback granular para contador de não lidas
        if (oldLead?.unread_count !== updatedLead?.unread_count) {
          if (onUpdateUnreadCount) {
            const increment = (updatedLead?.unread_count || 0) > (oldLead?.unread_count || 0);
            console.log('[Chats Realtime] 🔢 Atualizando contador via callback granular FASE 1:', {
              leadId: updatedLead.id,
              increment,
              oldCount: oldLead?.unread_count,
              newCount: updatedLead?.unread_count
            });
            onUpdateUnreadCount(updatedLead.id, increment);
            return;
          }
        }

        // Fallback: Refresh completo apenas se não há callback granular
        if (onContactsRefresh && !onUpdateUnreadCount) {
          console.log('[Chats Realtime] 🔄 Fallback: refresh completo para atualização de lead FASE 1');
          onContactsRefresh();
        }
      }
    } catch (error) {
      console.error('[Chats Realtime] ❌ Erro processando atualização de lead FASE 1:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [activeInstanceId, onContactsRefresh, onUpdateUnreadCount]);

  // 🚀 CONFIGURAR SUBSCRIPTION OTIMIZADA FASE 1
  useEffect(() => {
    const shouldActivate = !!userId && !!activeInstanceId;
    
    if (!shouldActivate) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Chats Realtime] ⚠️ Aguardando dados FASE 1:', {
          hasUserId: !!userId,
          hasActiveInstanceId: !!activeInstanceId
        });
      }
      cleanup();
      return;
    }
    
    const hasAnyCallback = !!(onMoveContactToTop || onUpdateUnreadCount || onAddNewContact || onContactUpdate || onNewContact || onContactsRefresh);
    if (!hasAnyCallback) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Chats Realtime] ⚠️ Nenhum callback configurado FASE 1');
      }
      cleanup();
      return;
    }

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

    // Atualizar refs
    lastUserIdRef.current = userId;
    lastInstanceIdRef.current = activeInstanceId;

    // 🚀 FASE 1: Configurar event listener global ANTES da subscription
    eventSubscriptionRef.current = windowEventManager.addEventListener(
      window,
      'whatsapp-contact-update',
      handleGlobalMessageEvent
    );

    // Criar novo canal
    const channelId = `chats-realtime-${userId}-${activeInstanceId}-${Date.now()}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Chats Realtime] 🚀 Configurando subscription FASE 1:', {
        userId,
        activeInstanceId,
        channelId
      });
    }

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
      
      .subscribe((status) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Chats Realtime] 📡 Status da subscription FASE 1:', status);
        }
        
        if (status === 'SUBSCRIBED') {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Chats Realtime] ✅ Realtime de chats ativo FASE 1');
          }
          isSubscribedRef.current = true;
          statsRef.current.connectionStatus = 'connected';
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Chats Realtime] ❌ Erro no canal de chats FASE 1');
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'error';
        } else if (status === 'CLOSED') {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Chats Realtime] 🔒 Canal de chats fechado FASE 1');
          }
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'disconnected';
        }
      });

    channelRef.current = channel;

  }, [userId, activeInstanceId, handleNewLead, handleLeadUpdate, handleGlobalMessageEvent, cleanup]);

  // 🧹 CLEANUP GERAL
  useEffect(() => {
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Chats Realtime] 🔌 Cleanup geral FASE 1');
      }
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
