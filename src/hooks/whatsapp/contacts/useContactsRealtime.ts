
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';

interface UseContactsRealtimeProps {
  userId: string | null;
  activeInstanceId: string | null;
  onContactUpdate?: (contactId: string, updates: Partial<Contact>) => void;
  onMoveToTop?: (contactId: string) => void;
  enabled?: boolean;
}

export const useContactsRealtime = ({
  userId,
  activeInstanceId,
  onContactUpdate,
  onMoveToTop,
  enabled = true
}: UseContactsRealtimeProps) => {
  
  const channelRef = useRef<any>(null);
  const isConnectedRef = useRef(false);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout>();
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const lastConfigRef = useRef<string>('');
  const setupInProgressRef = useRef(false);
  
  // ✅ ANTI-LOOP: Verificar se configuração mudou de fato
  const currentConfig = `${userId}-${activeInstanceId}-${enabled}`;
  
  // ✅ CLEANUP CONTROLADO com proteção anti-loop
  const cleanup = useCallback(() => {
    if (setupInProgressRef.current) {
      console.log('[Contacts Realtime] ⚠️ Setup em progresso, aguardando...');
      return;
    }
    
    console.log('[Contacts Realtime] 🧹 Iniciando cleanup');
    
    // Limpar debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = undefined;
    }
    
    // Limpar timeout de cleanup
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = undefined;
    }
    
    // Remover canal com try-catch
    if (channelRef.current) {
      try {
        console.log('[Contacts Realtime] 🔌 Removendo canal');
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('[Contacts Realtime] ⚠️ Erro ao remover canal:', error);
      } finally {
        channelRef.current = null;
      }
    }
    
    isConnectedRef.current = false;
    console.log('[Contacts Realtime] ✅ Cleanup concluído');
  }, []);

  // ✅ HANDLERS ESTÁVEIS com useCallback otimizado
  const handleLeadChange = useCallback((payload: any) => {
    if (!payload?.new || !userId || !activeInstanceId) return;
    
    const leadData = payload.new;
    
    // ✅ VERIFICAR SE É DO USUÁRIO ATUAL
    if (leadData.created_by_user_id !== userId) return;
    
    // ✅ DEBOUNCE CONTROLADO
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        console.log('[Contacts Realtime] 👤 Contato atualizado:', leadData.id);
        
        if (onContactUpdate) {
          const updates: Partial<Contact> = {
            name: leadData.name || leadData.phone || 'Sem nome',
            lastMessage: leadData.last_message || '',
            lastMessageTime: leadData.last_message_time || leadData.updated_at,
            unreadCount: leadData.unread_count || 0,
            tags: leadData.tags || []
          };
          
          onContactUpdate(leadData.id, updates);
        }
        
        // Mover para topo se tiver nova mensagem
        if (leadData.last_message && onMoveToTop) {
          onMoveToTop(leadData.id);
        }
      } catch (error) {
        console.error('[Contacts Realtime] ❌ Erro ao processar lead:', error);
      }
    }, 150);
  }, [userId, activeInstanceId, onContactUpdate, onMoveToTop]);

  const handleNewMessage = useCallback((payload: any) => {
    if (!payload?.new || !userId || !activeInstanceId) return;
    
    const messageData = payload.new;
    
    // ✅ FILTROS RIGOROSOS
    if (messageData.whatsapp_number_id !== activeInstanceId) return;
    
    // ✅ DEBOUNCE CONTROLADO
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        console.log('[Contacts Realtime] 📨 Nova mensagem para contato:', messageData.lead_id);
        
        if (onContactUpdate) {
          const updates: Partial<Contact> = {
            lastMessage: messageData.text || '📎 Mídia',
            lastMessageTime: messageData.created_at,
            unreadCount: messageData.from_me ? 0 : undefined
          };
          
          onContactUpdate(messageData.lead_id, updates);
        }
        
        // Mover para topo se não for mensagem enviada
        if (!messageData.from_me && onMoveToTop) {
          onMoveToTop(messageData.lead_id);
        }
      } catch (error) {
        console.error('[Contacts Realtime] ❌ Erro ao processar mensagem:', error);
      }
    }, 150);
  }, [userId, activeInstanceId, onContactUpdate, onMoveToTop]);

  // ✅ EFEITO PRINCIPAL com proteção anti-loop
  useEffect(() => {
    // ✅ VERIFICAR SE CONFIGURAÇÃO MUDOU
    if (currentConfig === lastConfigRef.current) {
      console.log('[Contacts Realtime] ⚠️ Configuração não mudou, mantendo conexão atual');
      return;
    }
    
    // ✅ VERIFICAR SE DEVE ATIVAR
    if (!enabled || !userId || !activeInstanceId) {
      console.log('[Contacts Realtime] ⚠️ Parâmetros inválidos, fazendo cleanup');
      cleanup();
      lastConfigRef.current = '';
      return;
    }

    // ✅ EVITAR SETUP CONCORRENTE
    if (setupInProgressRef.current) {
      console.log('[Contacts Realtime] ⚠️ Setup já em progresso, aguardando...');
      return;
    }

    setupInProgressRef.current = true;
    lastConfigRef.current = currentConfig;

    console.log('[Contacts Realtime] 🚀 Configurando realtime para contatos:', {
      userId,
      activeInstanceId,
      enabled
    });

    // Cleanup anterior
    cleanup();

    // Timeout para cleanup automático (5 minutos)
    cleanupTimeoutRef.current = setTimeout(cleanup, 300000);

    const channelId = `contacts-${userId}-${activeInstanceId}-${Date.now()}`;

    try {
      const channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads',
            filter: `created_by_user_id=eq.${userId}`
          },
          handleLeadChange
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `whatsapp_number_id=eq.${activeInstanceId}`
          },
          handleNewMessage
        )
        .subscribe((status) => {
          console.log('[Contacts Realtime] 📡 Status da conexão:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('[Contacts Realtime] ✅ Realtime de contatos ativo');
            isConnectedRef.current = true;
            setupInProgressRef.current = false;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('[Contacts Realtime] ❌ Erro na conexão:', status);
            isConnectedRef.current = false;
            setupInProgressRef.current = false;
          } else if (status === 'CLOSED') {
            console.log('[Contacts Realtime] 🔒 Canal de contatos fechado');
            isConnectedRef.current = false;
            setupInProgressRef.current = false;
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('[Contacts Realtime] ❌ Erro ao criar canal:', error);
      setupInProgressRef.current = false;
      cleanup();
    }

    return () => {
      setupInProgressRef.current = false;
      cleanup();
    };
  }, [enabled, userId, activeInstanceId, handleLeadChange, handleNewMessage, cleanup, currentConfig]);

  // ✅ CLEANUP GERAL
  useEffect(() => {
    return () => {
      setupInProgressRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnected: isConnectedRef.current
  };
};
