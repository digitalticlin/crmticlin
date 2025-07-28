
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
  
  // ✅ CLEANUP CONTROLADO
  const cleanup = useCallback(() => {
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

  // ✅ HANDLER PARA MUDANÇAS EM LEADS
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
    }, 100);
  }, [userId, activeInstanceId, onContactUpdate, onMoveToTop]);

  // ✅ HANDLER PARA NOVAS MENSAGENS
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
            unreadCount: messageData.from_me ? 0 : undefined // Não atualizar se for mensagem enviada
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
    }, 100);
  }, [userId, activeInstanceId, onContactUpdate, onMoveToTop]);

  // ✅ EFEITO PRINCIPAL
  useEffect(() => {
    if (!enabled || !userId || !activeInstanceId) {
      cleanup();
      return;
    }

    // ✅ EVITAR MÚLTIPLAS CONEXÕES
    if (isConnectedRef.current && channelRef.current) {
      console.log('[Contacts Realtime] ⚠️ Já conectado, reutilizando canal');
      return;
    }

    console.log('[Contacts Realtime] 🚀 Configurando realtime para contatos:', {
      userId,
      activeInstanceId
    });

    // Cleanup anterior
    cleanup();

    // Timeout para cleanup automático
    cleanupTimeoutRef.current = setTimeout(cleanup, 300000); // 5 minutos

    const channelId = `contacts-${userId}-${activeInstanceId}`;

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
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('[Contacts Realtime] ❌ Erro na conexão:', status);
            isConnectedRef.current = false;
          } else if (status === 'CLOSED') {
            console.log('[Contacts Realtime] 🔒 Canal de contatos fechado');
            isConnectedRef.current = false;
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('[Contacts Realtime] ❌ Erro ao criar canal:', error);
      cleanup();
    }

    return cleanup;
  }, [enabled, userId, activeInstanceId, handleLeadChange, handleNewMessage, cleanup]);

  // ✅ CLEANUP GERAL
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnected: isConnectedRef.current
  };
};
