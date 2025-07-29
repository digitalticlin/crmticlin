
/**
 * 🎯 HOOK ISOLADO: REALTIME PARA CARDS DE CONTATOS
 * 
 * RESPONSABILIDADE ÚNICA: Atualizar lista de contatos em tempo real
 * ✅ ESCOPO: Apenas cards da lista de contatos
 * ✅ EVENTOS: INSERT/UPDATE em 'leads' e 'messages' (para mover para topo)
 * 
 * ❌ NÃO FAZ: Mensagens individuais, conteúdo de chat, outros sistemas
 * 
 * ISOLAMENTO TOTAL: Este hook NÃO interfere com useMessagesRealtime
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatsRealtimeConfig, RealtimeConnectionStatus } from './types';
import { BigQueryOptimizer } from '@/utils/immediate-bigquery-fix';
import { realtimeLogger } from '@/utils/logger';

const isProduction = process.env.NODE_ENV === 'production';

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
  
  // Refs para gerenciamento de estado
  const channelRef = useRef<any>(null);
  const lastUserIdRef = useRef<string | null>(null);
  const lastInstanceIdRef = useRef<string | null>(null);
  const isSubscribedRef = useRef(false);
  const statsRef = useRef({
    totalEvents: 0,
    lastUpdate: null as number | null,
    connectionStatus: 'disconnected' as RealtimeConnectionStatus
  });

  // Cleanup otimizado
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      if (!isProduction) {
        realtimeLogger.log('🧹 Removendo canal de chats');
      }
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
      statsRef.current.connectionStatus = 'disconnected';
    }
  }, []);

  // Handler para novos leads otimizado
  const handleNewLead = useCallback((payload: any) => {
    try {
      const newLead = payload.new;
      
      // Verificar se é da instância ativa
      if (activeInstanceId && newLead?.whatsapp_number_id === activeInstanceId) {
        statsRef.current.totalEvents++;
        statsRef.current.lastUpdate = Date.now();

        // Priorizar callback granular
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
          
          onAddNewContact(newContactData);
          return;
        }

        // Fallback para callbacks legados
        if (onNewContact) {
          const contact = {
            id: newLead.id,
            name: newLead.name || newLead.phone || 'Contato',
            phone: newLead.phone
          };
          onNewContact(contact);
        }

        // Último recurso: refresh completo
        if (onContactsRefresh && !onAddNewContact) {
          onContactsRefresh();
        }
      }
    } catch (error) {
      console.error('[Chats Realtime] ❌ Erro processando novo lead:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [activeInstanceId, onNewContact, onContactsRefresh, onAddNewContact]);

  // Handler para atualizações de leads otimizado
  const handleLeadUpdate = useCallback((payload: any) => {
    try {
      const updatedLead = payload.new;
      const oldLead = payload.old;
      
      // Verificar se é da instância ativa
      if (activeInstanceId && updatedLead?.whatsapp_number_id === activeInstanceId) {
        statsRef.current.totalEvents++;
        statsRef.current.lastUpdate = Date.now();

        // Priorizar callback granular para contador de não lidas
        if (oldLead?.unread_count !== updatedLead?.unread_count) {
          if (onUpdateUnreadCount) {
            const increment = (updatedLead?.unread_count || 0) > (oldLead?.unread_count || 0);
            onUpdateUnreadCount(updatedLead.id, increment);
            return;
          }
        }

        // Fallback: refresh completo apenas se não há callback granular
        if (onContactsRefresh && !onUpdateUnreadCount) {
          onContactsRefresh();
        }
      }
    } catch (error) {
      console.error('[Chats Realtime] ❌ Erro processando atualização de lead:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [activeInstanceId, onContactsRefresh, onUpdateUnreadCount]);

  // Configurar subscription com lazy loading
  useEffect(() => {
    const shouldActivate = !!userId && !!activeInstanceId;
    
    if (!shouldActivate) {
      cleanup();
      return;
    }
    
    const hasAnyCallback = !!(onMoveContactToTop || onUpdateUnreadCount || onAddNewContact || onContactUpdate || onNewContact || onContactsRefresh);
    if (!hasAnyCallback) {
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

    // Criar novo canal
    const channelId = `chats-realtime-${userId}-${activeInstanceId}-${Date.now()}`;
    
    statsRef.current.connectionStatus = 'connecting';

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leads',
        filter: `whatsapp_number_id=eq.${activeInstanceId}`
      }, handleNewLead)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'leads',
        filter: `whatsapp_number_id=eq.${activeInstanceId}`
      }, handleLeadUpdate)
      .subscribe((status) => {
        if (!isProduction) {
          console.log('[Chats Realtime] 📡 Status da subscription:', status);
        }
        
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
          statsRef.current.connectionStatus = 'connected';
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Chats Realtime] ❌ Erro no canal de chats');
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'error';
        } else if (status === 'CLOSED') {
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'disconnected';
        }
      });

    channelRef.current = channel;

  }, [userId, activeInstanceId, handleNewLead, handleLeadUpdate, cleanup]);

  // Cleanup geral
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnected: isSubscribedRef.current,
    connectionStatus: statsRef.current.connectionStatus,
    totalEvents: statsRef.current.totalEvents,
    lastUpdate: statsRef.current.lastUpdate,
    forceDisconnect: cleanup
  };
};
