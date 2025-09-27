/**
 * 🎯 HOOK ISOLADO - REAL-TIME APENAS PARA CONTATOS
 *
 * RESPONSABILIDADES:
 * ✅ Real-time isolado APENAS para lista de contatos
 * ✅ Performance otimizada sem interferência
 * ✅ Debounce inteligente para invalidações
 * ✅ Multi-tenant security
 * ✅ Zero dependência do real-time de mensagens
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { chatContactsQueryKeys } from '@/hooks/chat/queryKeys';

interface UseContactsRealtimeParams {
  activeInstanceId?: string | null;
  onContactUpdate?: () => void;
  onMoveContactToTop?: (contactId: string, newMessage?: unknown) => void;
  onUpdateUnreadCount?: (contactId: string, increment?: boolean) => void;
  enabled?: boolean; // Controle para pausar/retomar
}

interface UseContactsRealtimeReturn {
  isConnected: boolean;
  reconnectAttempts: number;
  totalEvents: number;
  lastUpdate: number | null;
  pauseRealtime: () => void;
  resumeRealtime: () => void;
}

export const useContactsRealtime = ({
  activeInstanceId,
  onContactUpdate,
  onMoveContactToTop,
  onUpdateUnreadCount,
  enabled = true
}: UseContactsRealtimeParams): UseContactsRealtimeReturn => {

  console.log('[Contacts Realtime] 🚀 Hook ISOLADO para contatos inicializado:', {
    hasActiveInstance: !!activeInstanceId,
    enabled
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Estados isolados apenas para contatos
  const [isConnected, setIsConnected] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(!enabled);

  // Refs para controle isolado
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectAttempts = useRef(0);
  const setupInProgress = useRef(false);

  // Debounce específico para contatos
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const debouncedInvalidation = useCallback((delay = 500) => {
    if (isPaused) return;

    const key = 'contacts_invalidation';
    const existingTimer = debounceTimers.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      console.log('[Contacts Realtime] 🔄 Invalidando contatos (ISOLADO)');
      queryClient.invalidateQueries({
        queryKey: chatContactsQueryKeys.base
      });
      debounceTimers.current.delete(key);
    }, delay);

    debounceTimers.current.set(key, timer);
  }, [queryClient, isPaused]);

  // Setup real-time ISOLADO para contatos
  const setupContactsRealtime = useCallback(() => {
    if (!user?.id || isPaused) {
      console.log('[Contacts Realtime] ❌ Setup cancelado:', {
        hasUser: !!user?.id,
        isPaused
      });
      setIsConnected(false);
      setupInProgress.current = false;
      return;
    }

    // Prevenir setup duplicado
    if (setupInProgress.current) {
      console.log('[Contacts Realtime] ⏳ Setup já em progresso, aguardando...');
      return;
    }

    console.log('[Contacts Realtime] 🚀 Configurando real-time ISOLADO para contatos');
    setupInProgress.current = true;

    // Limpar canal anterior se existir
    if (channelRef.current) {
      console.log('[Contacts Realtime] 🧹 Removendo canal anterior');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelId = `contacts_isolated_${user.id}_${Date.now()}`;

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads',
        filter: `created_by_user_id=eq.${user.id}`
      }, (payload) => {
        if (isPaused) {
          console.log('[Contacts Realtime] ⏸️ Real-time pausado - ignorando evento');
          return;
        }

        console.log('[Contacts Realtime] 📨 Evento de contato ISOLADO:', {
          event: payload.eventType,
          leadId: payload.new?.id || payload.old?.id
        });

        setTotalEvents(prev => prev + 1);
        setLastUpdate(Date.now());

        // Invalidar queries com debounce
        debouncedInvalidation();

        // Callbacks opcionais
        if (onContactUpdate) {
          onContactUpdate();
        }

        // Callback específico para mover contato ao topo
        if (payload.eventType === 'UPDATE' && payload.new?.last_message && onMoveContactToTop) {
          onMoveContactToTop(payload.new.id, payload.new);
        }

        // Callback para atualizar contador de não lidas
        if (payload.eventType === 'UPDATE' && payload.new?.unread_count !== payload.old?.unread_count && onUpdateUnreadCount) {
          onUpdateUnreadCount(payload.new.id, payload.new.unread_count > (payload.old?.unread_count || 0));
        }
      })
      .subscribe((status) => {
        console.log('[Contacts Realtime] 📡 Status conexão ISOLADA:', status);

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          reconnectAttempts.current = 0;
          setupInProgress.current = false;
          console.log('[Contacts Realtime] ✅ Conexão ISOLADA estabelecida');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Contacts Realtime] ❌ Erro na conexão ISOLADA');
          setIsConnected(false);
          setupInProgress.current = false;

          // Retry automático limitado com exponential backoff
          if (reconnectAttempts.current < 3 && !isPaused) {
            const delay = Math.min(2000 * Math.pow(2, reconnectAttempts.current), 10000);
            setTimeout(() => {
              reconnectAttempts.current++;
              console.log('[Contacts Realtime] 🔄 Tentativa de reconexão:', reconnectAttempts.current);
              setupContactsRealtime();
            }, delay);
          } else {
            console.error('[Contacts Realtime] ❌ Limite de tentativas atingido');
          }
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          setupInProgress.current = false;
        }
      });

    channelRef.current = channel;
  }, [user?.id, isPaused, debouncedInvalidation, onContactUpdate, onMoveContactToTop, onUpdateUnreadCount]);

  // Controles para pausar/retomar
  const pauseRealtime = useCallback(() => {
    console.log('[Contacts Realtime] ⏸️ Pausando real-time ISOLADO');
    setIsPaused(true);
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const resumeRealtime = useCallback(() => {
    console.log('[Contacts Realtime] ▶️ Retomando real-time ISOLADO');
    setIsPaused(false);
    if (user?.id) {
      setupContactsRealtime();
    }
  }, [user?.id, setupContactsRealtime]);

  // Cleanup isolado
  const cleanup = useCallback(() => {
    console.log('[Contacts Realtime] 🧹 Cleanup ISOLADO');

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    debounceTimers.current.forEach(timer => clearTimeout(timer));
    debounceTimers.current.clear();

    setIsConnected(false);
    reconnectAttempts.current = 0;
    setupInProgress.current = false;
  }, []);

  // Effect principal - reagir a mudanças de usuário e estado de pausa
  useEffect(() => {
    if (user?.id && !isPaused) {
      // Debounce para evitar múltiplos setups
      const timer = setTimeout(() => {
        setupContactsRealtime();
      }, 150);

      return () => {
        clearTimeout(timer);
        cleanup();
      };
    } else {
      cleanup();
    }

    return cleanup;
  }, [user?.id, isPaused]);

  // Effect para mudança no enabled
  useEffect(() => {
    if (enabled !== !isPaused) {
      if (enabled) {
        resumeRealtime();
      } else {
        pauseRealtime();
      }
    }
  }, [enabled, isPaused, resumeRealtime, pauseRealtime]);

  return {
    isConnected,
    reconnectAttempts: reconnectAttempts.current,
    totalEvents,
    lastUpdate,
    pauseRealtime,
    resumeRealtime
  };
};