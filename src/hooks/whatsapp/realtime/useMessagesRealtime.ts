/**
 * 🎯 HOOK ISOLADO - REAL-TIME APENAS PARA MENSAGENS
 *
 * RESPONSABILIDADES:
 * ✅ Real-time isolado APENAS para conversas/mensagens
 * ✅ Performance máxima sem interferência dos contatos
 * ✅ Filtro específico por contato selecionado
 * ✅ Debounce otimizado para mensagens
 * ✅ Sistema anti-duplicação avançado
 * ✅ Zero dependência do real-time de contatos
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Contact, Message } from '@/types/chat';
import { chatMessagesQueryKeys } from '@/hooks/chat/queryKeys';

interface UseMessagesRealtimeParams {
  selectedContact: Contact | null;
  activeInstance?: { id: string; instance_name: string; connection_status: string } | null;
  onNewMessage?: (message: Message) => void;
  onMessageUpdate?: (message: Message) => void;
  enabled?: boolean; // Controle para pausar/retomar
}

interface UseMessagesRealtimeReturn {
  isConnected: boolean;
  reconnectAttempts: number;
  totalEvents: number;
  lastUpdate: number | null;
  pauseRealtime: () => void;
  resumeRealtime: () => void;
  processedCount: number;
  duplicateCount: number;
}

// Helper para normalizar mediaType
const normalizeMediaType = (mediaType?: string): "text" | "image" | "video" | "audio" | "document" => {
  if (!mediaType) return 'text';

  const normalizedType = mediaType.toLowerCase();
  if (normalizedType.includes('image')) return 'image';
  if (normalizedType.includes('video')) return 'video';
  if (normalizedType.includes('audio')) return 'audio';
  if (normalizedType.includes('document')) return 'document';

  return 'text';
};

// Converter mensagem para formato padronizado
const convertMessage = (messageData: Record<string, unknown>): Message => {
  return {
    id: messageData.id,
    text: messageData.text || '',
    fromMe: messageData.from_me || false,
    timestamp: messageData.created_at || new Date().toISOString(),
    status: messageData.status || 'sent',
    mediaType: normalizeMediaType(messageData.media_type),
    mediaUrl: messageData.media_url || undefined,
    sender: messageData.from_me ? 'user' : 'contact',
    time: new Date(messageData.created_at || Date.now()).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    isIncoming: !messageData.from_me,
    media_cache: messageData.media_cache || null
  };
};

export const useMessagesRealtime = ({
  selectedContact,
  activeInstance,
  onNewMessage,
  onMessageUpdate,
  enabled = true
}: UseMessagesRealtimeParams): UseMessagesRealtimeReturn => {

  console.log('[Messages Realtime] 🚀 Hook ISOLADO para mensagens inicializado:', {
    contactId: selectedContact?.id,
    contactName: selectedContact?.name,
    enabled
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Estados isolados apenas para mensagens
  const [isConnected, setIsConnected] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(!enabled);
  const [processedCount, setProcessedCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);

  // Refs para controle isolado
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectAttempts = useRef(0);
  const setupInProgress = useRef(false);

  // Cache anti-duplicação específico para mensagens
  const processedMessageIds = useRef<Set<string>>(new Set());
  const lastProcessedTimestamp = useRef<string | null>(null);

  // Debounce específico para mensagens (mais rápido que contatos)
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const debouncedInvalidation = useCallback((contactId: string, delay = 200) => {
    if (isPaused) return;

    const key = `messages_invalidation_${contactId}`;
    const existingTimer = debounceTimers.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      console.log('[Messages Realtime] 🔄 Invalidando mensagens (ISOLADO) para:', contactId);
      queryClient.invalidateQueries({
        queryKey: chatMessagesQueryKeys.byContact(contactId)
      });
      debounceTimers.current.delete(key);
    }, delay);

    debounceTimers.current.set(key, timer);
  }, [queryClient, isPaused]);

  // Filtro avançado - MULTI-TENANT + ANTI-DUPLICAÇÃO
  const shouldProcessMessage = useCallback((messageData: Record<string, unknown>, isUpdate = false): boolean => {
    console.log('[Messages Realtime] 🔍 Avaliando mensagem ISOLADA:', {
      messageId: messageData.id,
      leadId: messageData.lead_id,
      selectedContactId: selectedContact?.id,
      createdByUserId: messageData.created_by_user_id,
      currentUserId: user?.id,
      fromMe: messageData.from_me,
      isUpdate
    });

    // Verificação de segurança multi-tenant
    if (!user?.id || messageData.created_by_user_id !== user.id) {
      console.log('[Messages Realtime] ❌ Usuário não autorizado (ISOLADO)');
      return false;
    }

    // Verificação se é para o contato atual
    if (!selectedContact || messageData.lead_id !== selectedContact.id) {
      console.log('[Messages Realtime] ❌ Lead ID não corresponde (ISOLADO)');
      return false;
    }

    // Para UPDATEs, permitir sempre (status de mensagem)
    if (isUpdate) {
      console.log('[Messages Realtime] ✅ UPDATE aceito (ISOLADO):', messageData.id);
      return true;
    }

    // Verificar duplicação apenas para INSERTs
    if (processedMessageIds.current.has(messageData.id)) {
      console.log('[Messages Realtime] ❌ Mensagem já processada (ISOLADO):', messageData.id);
      setDuplicateCount(prev => prev + 1);
      return false;
    }

    console.log('[Messages Realtime] ✅ Nova mensagem aceita (ISOLADO):', messageData.id);
    return true;
  }, [selectedContact, user?.id]);

  // Setup real-time ISOLADO para mensagens
  const setupMessagesRealtime = useCallback(() => {
    if (!user?.id || !selectedContact || isPaused || setupInProgress.current) {
      console.log('[Messages Realtime] ❌ Setup cancelado (ISOLADO):', {
        hasUser: !!user?.id,
        hasContact: !!selectedContact,
        isPaused,
        setupInProgress: setupInProgress.current
      });
      setIsConnected(false);
      return;
    }

    console.log('[Messages Realtime] 🚀 Configurando real-time ISOLADO para mensagens:', {
      contactId: selectedContact.id,
      contactName: selectedContact.name
    });

    setupInProgress.current = true;

    // Limpar canal anterior se existir
    if (channelRef.current) {
      console.log('[Messages Realtime] 🧹 Removendo canal anterior (ISOLADO)');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Limpar cache ao trocar de contato
    processedMessageIds.current.clear();
    lastProcessedTimestamp.current = null;
    setProcessedCount(0);
    setDuplicateCount(0);

    const channelId = `messages_isolated_${selectedContact.id}_${Date.now()}`;

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `created_by_user_id=eq.${user.id}`
      }, (payload) => {
        if (isPaused) {
          console.log('[Messages Realtime] ⏸️ Real-time pausado - ignorando INSERT');
          return;
        }

        const messageData = payload.new;

        console.log('[Messages Realtime] 📨 INSERT mensagem (ISOLADO):', {
          messageId: messageData.id,
          fromMe: messageData.from_me,
          leadId: messageData.lead_id,
          text: messageData.text?.substring(0, 30) + '...'
        });

        if (!shouldProcessMessage(messageData, false)) {
          return;
        }

        const message = convertMessage(messageData);

        setTotalEvents(prev => prev + 1);
        setLastUpdate(Date.now());
        setProcessedCount(prev => prev + 1);

        // Marcar como processada
        processedMessageIds.current.add(message.id);
        lastProcessedTimestamp.current = message.timestamp;

        // Usar callback se disponível, senão invalidar via React Query
        if (onNewMessage) {
          console.log('[Messages Realtime] 🎯 Usando callback onNewMessage (ISOLADO)');
          onNewMessage(message);
        } else {
          console.log('[Messages Realtime] 🔄 Invalidando via React Query (ISOLADO)');
          debouncedInvalidation(selectedContact.id);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `created_by_user_id=eq.${user.id}`
      }, (payload) => {
        if (isPaused) {
          console.log('[Messages Realtime] ⏸️ Real-time pausado - ignorando UPDATE');
          return;
        }

        const messageData = payload.new;

        if (!shouldProcessMessage(messageData, true)) {
          return;
        }

        const message = convertMessage(messageData);

        console.log('[Messages Realtime] 🔄 UPDATE mensagem (ISOLADO):', {
          messageId: message.id,
          status: message.status
        });

        setTotalEvents(prev => prev + 1);
        setLastUpdate(Date.now());

        // Usar callback ou invalidar
        if (onMessageUpdate) {
          console.log('[Messages Realtime] 🎯 Usando callback onMessageUpdate (ISOLADO)');
          onMessageUpdate(message);
        } else {
          console.log('[Messages Realtime] 🔄 Invalidando via React Query (ISOLADO)');
          debouncedInvalidation(selectedContact.id);
        }
      })
      .subscribe((status) => {
        console.log('[Messages Realtime] 📡 Status conexão ISOLADA:', status);

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          reconnectAttempts.current = 0;
          setupInProgress.current = false;
          console.log('[Messages Realtime] ✅ Conexão ISOLADA estabelecida');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Messages Realtime] ❌ Erro na conexão ISOLADA');
          setIsConnected(false);
          setupInProgress.current = false;

          // Retry automático limitado
          if (reconnectAttempts.current < 3) {
            setTimeout(() => {
              reconnectAttempts.current++;
              console.log('[Messages Realtime] 🔄 Tentativa de reconexão:', reconnectAttempts.current);
              setupMessagesRealtime();
            }, 1000 * reconnectAttempts.current);
          }
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          setupInProgress.current = false;
        }
      });

    channelRef.current = channel;
  }, [user?.id, selectedContact, isPaused, shouldProcessMessage, onNewMessage, onMessageUpdate, debouncedInvalidation]);

  // Controles para pausar/retomar
  const pauseRealtime = useCallback(() => {
    console.log('[Messages Realtime] ⏸️ Pausando real-time ISOLADO');
    setIsPaused(true);
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const resumeRealtime = useCallback(() => {
    console.log('[Messages Realtime] ▶️ Retomando real-time ISOLADO');
    setIsPaused(false);
    if (user?.id && selectedContact) {
      setupMessagesRealtime();
    }
  }, [user?.id, selectedContact, setupMessagesRealtime]);

  // Cleanup isolado
  const cleanup = useCallback(() => {
    console.log('[Messages Realtime] 🧹 Cleanup ISOLADO');

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    debounceTimers.current.forEach(timer => clearTimeout(timer));
    debounceTimers.current.clear();

    processedMessageIds.current.clear();
    lastProcessedTimestamp.current = null;

    setIsConnected(false);
    reconnectAttempts.current = 0;
    setupInProgress.current = false;
  }, []);

  // Effect principal - reagir a mudanças de contato selecionado
  useEffect(() => {
    if (user?.id && selectedContact && !isPaused) {
      setupMessagesRealtime();
    } else {
      cleanup();
    }

    return cleanup;
  }, [user?.id, selectedContact, isPaused, setupMessagesRealtime, cleanup]);

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
    resumeRealtime,
    processedCount,
    duplicateCount
  };
};