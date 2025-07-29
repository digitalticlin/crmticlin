
/**
 * 🎯 HOOK REALTIME PARA CARDS DE CONTATOS - OTIMIZADO
 * 
 * CORREÇÕES APLICADAS:
 * ✅ Callbacks otimizados para mover cards para o topo
 * ✅ Animações suaves para atualizações de cards
 * ✅ Debounce para evitar atualizações múltiplas
 * ✅ Sistema de reconnection melhorado
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChatsRealtimeConfig, RealtimeConnectionStatus } from './types';

const isProduction = process.env.NODE_ENV === 'production';

export const useChatsRealtime = ({
  activeInstanceId,
  onContactUpdate,
  onNewContact,
  onContactsRefresh,
  onMoveContactToTop,
  onUpdateUnreadCount,
  onAddNewContact
}: ChatsRealtimeConfig) => {
  
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isSubscribedRef = useRef(false);
  const statsRef = useRef({
    totalEvents: 0,
    lastUpdate: null as number | null,
    connectionStatus: 'disconnected' as RealtimeConnectionStatus
  });

  // Debounce para callbacks
  const debouncedCallbacks = useRef<{
    [key: string]: NodeJS.Timeout;
  }>({});

  const debounceCallback = useCallback((callback: () => void, key: string, delay = 300) => {
    if (debouncedCallbacks.current[key]) {
      clearTimeout(debouncedCallbacks.current[key]);
    }
    
    debouncedCallbacks.current[key] = setTimeout(callback, delay);
  }, []);

  // Sistema de reconnection
  const reconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('[ChatsRealtime] ❌ Máximo de tentativas atingido');
      statsRef.current.connectionStatus = 'error';
      return;
    }

    const delay = Math.min(Math.pow(2, reconnectAttempts.current) * 1000, 30000);
    reconnectAttempts.current++;
    
    console.log(`[ChatsRealtime] 🔄 Reconnecting em ${delay}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setupRealtime();
    }, delay);
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    Object.values(debouncedCallbacks.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    debouncedCallbacks.current = {};
    
    if (channelRef.current) {
      console.log('[ChatsRealtime] 🧹 Removendo canal');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
      statsRef.current.connectionStatus = 'disconnected';
    }
    
    reconnectAttempts.current = 0;
  }, []);

  // 🚀 CORREÇÃO: Handler para novos leads com animação
  const handleNewLead = useCallback((payload: any) => {
    try {
      const newLead = payload.new;
      
      if (!user?.id || newLead?.created_by_user_id !== user.id) {
        return;
      }
      
      if (activeInstanceId && newLead?.whatsapp_number_id === activeInstanceId) {
        statsRef.current.totalEvents++;
        statsRef.current.lastUpdate = Date.now();

        console.log('[ChatsRealtime] 👤 Novo lead:', newLead.id);

        // ✅ CORREÇÃO: Usar callback otimizado para adicionar contato
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
            createdAt: newLead.created_at,
            isNew: true // Flag para animação
          };
          
          debounceCallback(() => {
            onAddNewContact(newContactData);
          }, 'addNewContact', 100); // Delay menor para novos contatos
          
          return;
        }

        // Fallback
        if (onContactsRefresh) {
          debounceCallback(() => onContactsRefresh(), 'contactsRefresh');
        }
      }
    } catch (error) {
      console.error('[ChatsRealtime] ❌ Erro processando novo lead:', error);
    }
  }, [activeInstanceId, onAddNewContact, onContactsRefresh, user?.id, debounceCallback]);

  // 🚀 CORREÇÃO: Handler para updates de leads com animação
  const handleLeadUpdate = useCallback((payload: any) => {
    try {
      const updatedLead = payload.new;
      const oldLead = payload.old;
      
      if (!user?.id || updatedLead?.created_by_user_id !== user.id) {
        return;
      }
      
      if (activeInstanceId && updatedLead?.whatsapp_number_id === activeInstanceId) {
        statsRef.current.totalEvents++;
        statsRef.current.lastUpdate = Date.now();

        console.log('[ChatsRealtime] 🔄 Lead atualizado:', updatedLead.id);

        // ✅ CORREÇÃO: Atualização de unread count
        if (oldLead?.unread_count !== updatedLead?.unread_count) {
          if (onUpdateUnreadCount) {
            const increment = (updatedLead?.unread_count || 0) > (oldLead?.unread_count || 0);
            
            debounceCallback(() => {
              onUpdateUnreadCount(updatedLead.id, increment);
            }, `updateUnread-${updatedLead.id}`, 100);
            
            return;
          }
        }

        // ✅ CORREÇÃO: Mover para o topo se houve nova mensagem
        if (updatedLead?.last_message_time !== oldLead?.last_message_time) {
          if (onMoveContactToTop) {
            const messageUpdate = {
              text: updatedLead.last_message || '',
              timestamp: updatedLead.last_message_time || new Date().toISOString(),
              unreadCount: updatedLead.unread_count || 0
            };
            
            debounceCallback(() => {
              onMoveContactToTop(updatedLead.id, messageUpdate);
            }, `moveToTop-${updatedLead.id}`, 100);
            
            return;
          }
        }

        // Fallback
        if (onContactsRefresh) {
          debounceCallback(() => onContactsRefresh(), 'contactsRefresh');
        }
      }
    } catch (error) {
      console.error('[ChatsRealtime] ❌ Erro processando update:', error);
    }
  }, [activeInstanceId, onUpdateUnreadCount, onMoveContactToTop, onContactsRefresh, user?.id, debounceCallback]);

  // Setup realtime
  const setupRealtime = useCallback(() => {
    if (!user?.id || !activeInstanceId) {
      cleanup();
      return;
    }
    
    const hasAnyCallback = !!(onMoveContactToTop || onUpdateUnreadCount || onAddNewContact || onContactUpdate || onNewContact || onContactsRefresh);
    if (!hasAnyCallback) {
      cleanup();
      return;
    }

    console.log('[ChatsRealtime] 🚀 Configurando realtime:', {
      userId: user.id,
      instanceId: activeInstanceId,
      callbacks: {
        moveToTop: !!onMoveContactToTop,
        updateUnread: !!onUpdateUnreadCount,
        addNew: !!onAddNewContact
      }
    });

    cleanup();
    
    const channelId = `chats-realtime-${user.id}-${activeInstanceId}-${Date.now()}`;
    statsRef.current.connectionStatus = 'connecting';

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leads',
        filter: `created_by_user_id=eq.${user.id}`
      }, handleNewLead)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'leads',
        filter: `created_by_user_id=eq.${user.id}`
      }, handleLeadUpdate)
      .subscribe((status) => {
        console.log('[ChatsRealtime] 📡 Status:', status);
        
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
          statsRef.current.connectionStatus = 'connected';
          reconnectAttempts.current = 0;
          console.log('[ChatsRealtime] ✅ Conectado');
        } else if (status === 'CHANNEL_ERROR') {
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'error';
          reconnect();
        } else if (status === 'CLOSED') {
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'disconnected';
        } else if (status === 'TIMED_OUT') {
          reconnect();
        }
      });

    channelRef.current = channel;
  }, [user?.id, activeInstanceId, handleNewLead, handleLeadUpdate, cleanup, reconnect]);

  // Configurar subscription
  useEffect(() => {
    if (user?.id && activeInstanceId) {
      setupRealtime();
    } else {
      cleanup();
    }
  }, [user?.id, activeInstanceId, setupRealtime, cleanup]);

  // Heartbeat
  useEffect(() => {
    if (!channelRef.current) return;
    
    const heartbeat = setInterval(() => {
      if (channelRef.current && channelRef.current.state === 'closed') {
        console.log('[ChatsRealtime] 💔 Conexão morta detectada');
        reconnect();
      }
    }, 30000);

    return () => clearInterval(heartbeat);
  }, [reconnect]);

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
    reconnectAttempts: reconnectAttempts.current,
    forceDisconnect: cleanup
  };
};
