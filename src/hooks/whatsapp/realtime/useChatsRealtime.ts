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
  
  // 🚀 PROTEÇÃO ANTI-LOOP
  const executionCountRef = useRef(0);
  const lastParamsRef = useRef<string>('');
  const lastExecutionTimeRef = useRef(0);
  
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
      realtimeLogger.log('🧹 Removendo canal de chats');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
      statsRef.current.connectionStatus = 'disconnected';
    }
  }, []);

  // 👤 HANDLER PARA NOVOS LEADS
  const handleNewLead = useCallback((payload: any) => {
    try {
      const newLead = payload.new;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Chats Realtime] 👤 Novo lead detectado:', {
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
          
          console.log('[Chats Realtime] ➕ Adicionando novo contato via callback granular');
          onAddNewContact(newContactData);
          return; // ✅ EVITAR refresh se callback granular existe
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
          console.log('[Chats Realtime] 🔄 Fallback: refresh completo para novo lead');
          onContactsRefresh();
        }
      }
    } catch (error) {
      console.error('[Chats Realtime] ❌ Erro processando novo lead:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [activeInstanceId, onNewContact, onContactsRefresh, onAddNewContact]);

  // 📝 HANDLER PARA ATUALIZAÇÕES DE LEADS
  const handleLeadUpdate = useCallback((payload: any) => {
    try {
      const updatedLead = payload.new;
      const oldLead = payload.old;
      
      if (process.env.NODE_ENV === 'development') {
      console.log('[Chats Realtime] 📝 Lead atualizado:', {
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
            console.log('[Chats Realtime] 🔢 Atualizando contador via callback granular:', {
              leadId: updatedLead.id,
              increment,
              oldCount: oldLead?.unread_count,
              newCount: updatedLead?.unread_count
            });
            onUpdateUnreadCount(updatedLead.id, increment);
            return; // ✅ EVITAR refresh se callback granular existe
          }
        }

        // Fallback: Refresh completo apenas se não há callback granular
        if (onContactsRefresh && !onUpdateUnreadCount) {
          console.log('[Chats Realtime] 🔄 Fallback: refresh completo para atualização de lead');
          onContactsRefresh();
        }
      }
    } catch (error) {
      console.error('[Chats Realtime] ❌ Erro processando atualização de lead:', error);
      BigQueryOptimizer.handleError(error);
    }
  }, [activeInstanceId, onContactsRefresh, onUpdateUnreadCount]);

  // ❌ REMOVIDO: handleNewMessage 
  // Motivo: useMessageRealtime agora é responsável por mover contatos para o topo
  // Esta função duplicava responsabilidades e criava subscriptions desnecessárias

  // 🚀 CONFIGURAR SUBSCRIPTION QUANDO NECESSÁRIO (LAZY LOADING)
  useEffect(() => {
    // 🚀 LAZY LOADING OTIMIZADO: Só ativar se realmente tem dados para monitorar
    const shouldActivate = !!userId && !!activeInstanceId;
    
    if (!shouldActivate) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Chats Realtime] ⚠️ Lazy loading: aguardando userId e activeInstanceId', {
          hasUserId: !!userId,
          userId,
          hasActiveInstanceId: !!activeInstanceId,
          activeInstanceId
        });
      }
      // Cleanup se estava ativo antes
      cleanup();
      return;
    }
    
    // ✅ CORREÇÃO CRÍTICA: Sempre ativar se há pelo menos um callback (incluindo fallbacks)
    const hasAnyCallback = !!(onMoveContactToTop || onUpdateUnreadCount || onAddNewContact || onContactUpdate || onNewContact || onContactsRefresh);
    if (!hasAnyCallback) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Chats Realtime] ⚠️ Nenhum callback configurado - não ativando realtime');
      }
      cleanup();
      return;
    }

    // 🚀 PROTEÇÃO ANTI-LOOP: Verificar parâmetros e timing
    const currentParams = `${userId}-${activeInstanceId}`;
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutionTimeRef.current;
    
    // Se mesmos parâmetros e executou há menos de 1 segundo = possível loop
    if (currentParams === lastParamsRef.current && timeSinceLastExecution < 1000) {
      executionCountRef.current++;
      if (executionCountRef.current > 3) {
        console.error('[Chats Realtime] 🚨 LOOP INFINITO DETECTADO!', {
          executionCount: executionCountRef.current,
          timeSinceLastExecution
        });
        return;
      }
    } else {
      // Reset contador se parâmetros mudaram ou tempo suficiente passou
      executionCountRef.current = 1;
    }
    
    lastParamsRef.current = currentParams;
    lastExecutionTimeRef.current = now;

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
    
    if (process.env.NODE_ENV === 'development') {
    console.log('[Chats Realtime] 🚀 Configurando subscription para chats:', {
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
      
      // 🎯 REMOVIDO: Subscription de messages duplicada
      // RESPONSABILIDADE TRANSFERIDA para useMessagesRealtime que notificará contatos
      // via callback específico (evita processamento duplicado)
      
      .subscribe((status) => {
        if (process.env.NODE_ENV === 'development') {
        console.log('[Chats Realtime] 📡 Status da subscription de chats:', status);
        }
        
        if (status === 'SUBSCRIBED') {
          if (process.env.NODE_ENV === 'development') {
          console.log('[Chats Realtime] ✅ Realtime de chats ativo');
          }
          isSubscribedRef.current = true;
          statsRef.current.connectionStatus = 'connected';
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Chats Realtime] ❌ Erro no canal de chats');
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'error';
        } else if (status === 'CLOSED') {
          if (process.env.NODE_ENV === 'development') {
          console.log('[Chats Realtime] 🔒 Canal de chats fechado');
          }
          isSubscribedRef.current = false;
          statsRef.current.connectionStatus = 'disconnected';
        }
      });

    channelRef.current = channel;

  }, [userId, activeInstanceId, handleNewLead, handleLeadUpdate, cleanup]);

  // 🧹 CLEANUP GERAL
  useEffect(() => {
    return () => {
      if (process.env.NODE_ENV === 'development') {
      console.log('[Chats Realtime] 🔌 Cleanup geral');
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