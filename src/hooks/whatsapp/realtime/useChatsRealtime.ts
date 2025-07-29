
/**
 * 🎯 HOOK ISOLADO: REALTIME PARA CARDS DE CONTATOS - MULTITENANCY CORRIGIDO
 * 
 * CORREÇÕES APLICADAS:
 * ✅ Validação dupla de ownership em todos os callbacks
 * ✅ Debounce para evitar atualizações múltiplas simultâneas
 * ✅ Sistema de reconnection com retry exponencial
 * ✅ Heartbeat para detectar conexões mortas
 * ✅ Filtros rigorosos de multitenancy
 * ✅ Isolamento total por usuário
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChatsRealtimeConfig, RealtimeConnectionStatus } from './types';
import { BigQueryOptimizer } from '@/utils/immediate-bigquery-fix';
import { realtimeLogger } from '@/utils/logger';

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
  
  const { user } = useAuth(); // 🚀 CORREÇÃO: Conectar diretamente ao useAuth
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const lastUserIdRef = useRef<string | null>(null);
  const lastInstanceIdRef = useRef<string | null>(null);
  const isSubscribedRef = useRef(false);
  const statsRef = useRef({
    totalEvents: 0,
    lastUpdate: null as number | null,
    connectionStatus: 'disconnected' as RealtimeConnectionStatus
  });

  // 🚀 CORREÇÃO: Debounce para callbacks
  const debouncedCallbacks = useRef<{
    [key: string]: NodeJS.Timeout;
  }>({});

  const debounceCallback = useCallback((callback: () => void, key: string, delay = 300) => {
    if (debouncedCallbacks.current[key]) {
      clearTimeout(debouncedCallbacks.current[key]);
    }
    
    debouncedCallbacks.current[key] = setTimeout(callback, delay);
  }, []);

  // 🚀 CORREÇÃO: Sistema de reconnection com retry exponencial
  const reconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('[ChatsRealtime] ❌ Máximo de tentativas de reconnection atingido');
      statsRef.current.connectionStatus = 'error';
      return;
    }

    const delay = Math.pow(2, reconnectAttempts.current) * 1000;
    reconnectAttempts.current++;
    
    console.log(`[ChatsRealtime] 🔄 Tentativa de reconnection ${reconnectAttempts.current}/${maxReconnectAttempts} em ${delay}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setupRealtime();
    }, delay);
  }, []);

  // Cleanup otimizado
  const cleanup = useCallback(() => {
    // Limpar timeouts de reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Limpar timeouts de debounce
    Object.values(debouncedCallbacks.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    debouncedCallbacks.current = {};
    
    if (channelRef.current) {
      if (!isProduction) {
        realtimeLogger.log('🧹 Removendo canal de chats');
      }
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
      statsRef.current.connectionStatus = 'disconnected';
    }
    
    reconnectAttempts.current = 0;
  }, []);

  // Handler para novos leads otimizado com validação de ownership
  const handleNewLead = useCallback((payload: any) => {
    try {
      const newLead = payload.new;
      
      // 🚀 CORREÇÃO: Validação dupla de ownership
      if (!user?.id || newLead?.created_by_user_id !== user.id) {
        console.warn('[ChatsRealtime] 🚨 Tentativa de acesso cross-user bloqueada:', {
          userId: user?.id,
          leadOwner: newLead?.created_by_user_id,
          leadId: newLead?.id
        });
        return;
      }
      
      // Verificar se é da instância ativa
      if (activeInstanceId && newLead?.whatsapp_number_id === activeInstanceId) {
        statsRef.current.totalEvents++;
        statsRef.current.lastUpdate = Date.now();

        // 🚀 CORREÇÃO: Aplicar debounce nos callbacks
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
          
          debounceCallback(() => onAddNewContact(newContactData), 'addNewContact');
          return;
        }

        // Fallback para callbacks legados
        if (onNewContact) {
          const contact = {
            id: newLead.id,
            name: newLead.name || newLead.phone || 'Contato',
            phone: newLead.phone
          };
          debounceCallback(() => onNewContact(contact), 'newContact');
        }

        // Último recurso: refresh completo
        if (onContactsRefresh && !onAddNewContact) {
          debounceCallback(() => onContactsRefresh(), 'contactsRefresh');
        }
      }
    } catch (error) {
      console.error('[ChatsRealtime] ❌ Erro processando novo lead:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [activeInstanceId, onNewContact, onContactsRefresh, onAddNewContact, user?.id, debounceCallback]);

  // Handler para atualizações de leads otimizado com validação de ownership
  const handleLeadUpdate = useCallback((payload: any) => {
    try {
      const updatedLead = payload.new;
      const oldLead = payload.old;
      
      // 🚀 CORREÇÃO: Validação dupla de ownership
      if (!user?.id || updatedLead?.created_by_user_id !== user.id) {
        console.warn('[ChatsRealtime] 🚨 Tentativa de acesso cross-user bloqueada:', {
          userId: user?.id,
          leadOwner: updatedLead?.created_by_user_id,
          leadId: updatedLead?.id
        });
        return;
      }
      
      // Verificar se é da instância ativa
      if (activeInstanceId && updatedLead?.whatsapp_number_id === activeInstanceId) {
        statsRef.current.totalEvents++;
        statsRef.current.lastUpdate = Date.now();

        // 🚀 CORREÇÃO: Aplicar debounce nos callbacks
        if (oldLead?.unread_count !== updatedLead?.unread_count) {
          if (onUpdateUnreadCount) {
            const increment = (updatedLead?.unread_count || 0) > (oldLead?.unread_count || 0);
            debounceCallback(() => onUpdateUnreadCount(updatedLead.id, increment), 'updateUnreadCount');
            return;
          }
        }

        // Fallback: refresh completo apenas se não há callback granular
        if (onContactsRefresh && !onUpdateUnreadCount) {
          debounceCallback(() => onContactsRefresh(), 'contactsRefresh');
        }
      }
    } catch (error) {
      console.error('[ChatsRealtime] ❌ Erro processando atualização de lead:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [activeInstanceId, onContactsRefresh, onUpdateUnreadCount, user?.id, debounceCallback]);

  // 🚀 CORREÇÃO: Setup realtime com validação rigorosa de multitenancy
  const setupRealtime = useCallback(() => {
    // 🚀 CORREÇÃO: Validação rigorosa de usuário
    if (!user?.id || !activeInstanceId) {
      console.warn('[ChatsRealtime] ⚠️ Usuário não autenticado ou instância não ativa');
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
      lastUserIdRef.current !== user.id ||
      lastInstanceIdRef.current !== activeInstanceId ||
      !isSubscribedRef.current;

    if (!needsReconfigure) {
      return;
    }

    // Cleanup anterior
    cleanup();

    // Atualizar refs
    lastUserIdRef.current = user.id;
    lastInstanceIdRef.current = activeInstanceId;

    // Criar novo canal
    const channelId = `chats-realtime-${user.id}-${activeInstanceId}-${Date.now()}`;
    
    statsRef.current.connectionStatus = 'connecting';

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leads',
        filter: `created_by_user_id=eq.${user.id}` // 🚀 CORREÇÃO: Filtro rigoroso
      }, handleNewLead)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'leads',
        filter: `created_by_user_id=eq.${user.id}` // 🚀 CORREÇÃO: Filtro rigoroso
      }, handleLeadUpdate)
      .subscribe((status) => {
        if (!isProduction) {
          console.log('[ChatsRealtime] 📡 Status da subscription:', status);
        }
        
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
          statsRef.current.connectionStatus = 'connected';
          reconnectAttempts.current = 0; // Reset tentativas após sucesso
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[ChatsRealtime] ❌ Erro no canal de chats, tentando reconnection');
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'error';
          reconnect();
        } else if (status === 'CLOSED') {
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'disconnected';
        } else if (status === 'TIMED_OUT') {
          console.error('[ChatsRealtime] ⏱️ Timeout, tentando reconnection');
          reconnect();
        }
      });

    channelRef.current = channel;
  }, [user?.id, activeInstanceId, handleNewLead, handleLeadUpdate, cleanup, reconnect]);

  // 🚀 CORREÇÃO: Configurar subscription apenas quando usuário estiver autenticado
  useEffect(() => {
    if (user?.id && activeInstanceId) {
      setupRealtime();
    } else {
      cleanup();
    }
  }, [user?.id, activeInstanceId, setupRealtime, cleanup]);

  // 🚀 CORREÇÃO: Heartbeat para detectar conexões mortas
  useEffect(() => {
    if (!channelRef.current) return;
    
    const heartbeat = setInterval(() => {
      if (channelRef.current && channelRef.current.state === 'closed') {
        console.log('[ChatsRealtime] 💔 Conexão morta detectada, reconnectando...');
        reconnect();
      }
    }, 30000); // Check a cada 30 segundos

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
