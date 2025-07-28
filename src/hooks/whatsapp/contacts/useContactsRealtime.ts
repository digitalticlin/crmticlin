
/**
 * 🎯 HOOK REALTIME ESPECÍFICO PARA CONTATOS
 * 
 * Responsabilidade: Atualizar lista de contatos quando mensagens chegam
 * Funcionalidades: Mover para topo, atualizar última mensagem, contador
 */

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
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  
  // ✅ CLEANUP
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log('[Contacts Realtime] 🧹 Limpando canal');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // ✅ HANDLER PARA NOVAS MENSAGENS
  const handleNewMessage = useCallback((payload: any) => {
    const messageData = payload.new;
    
    console.log('[Contacts Realtime] 📨 Nova mensagem detectada:', {
      messageId: messageData.id,
      leadId: messageData.lead_id,
      fromMe: messageData.from_me,
      text: messageData.text?.substring(0, 50) + '...',
      instanceId: messageData.whatsapp_number_id
    });

    // ✅ FILTRO: Só processar se for da instância ativa
    if (activeInstanceId && messageData.whatsapp_number_id !== activeInstanceId) {
      console.log('[Contacts Realtime] 🚫 Mensagem de outra instância ignorada');
      return;
    }

    // ✅ DEBOUNCE PARA EVITAR MÚLTIPLAS ATUALIZAÇÕES
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const contactId = messageData.lead_id;
        
        if (contactId) {
          // ✅ MOVER PARA TOPO
          if (onMoveToTop) {
            console.log('[Contacts Realtime] 🔝 Movendo contato para topo:', contactId);
            onMoveToTop(contactId);
          }
          
          // ✅ ATUALIZAR DADOS DO CONTATO
          if (onContactUpdate) {
            const updates: Partial<Contact> = {
              lastMessage: messageData.text || '[Mensagem de mídia]',
              lastMessageTime: messageData.created_at,
              unreadCount: messageData.from_me ? undefined : 1 // Só incrementar se não for de mim
            };
            
            console.log('[Contacts Realtime] 🔄 Atualizando dados do contato:', {
              contactId,
              updates
            });
            
            onContactUpdate(contactId, updates);
          }
        }
      } catch (error) {
        console.error('[Contacts Realtime] ❌ Erro ao processar nova mensagem:', error);
      }
    }, 150); // 150ms debounce
  }, [activeInstanceId, onMoveToTop, onContactUpdate]);

  // ✅ HANDLER PARA NOVOS LEADS
  const handleNewLead = useCallback((payload: any) => {
    const leadData = payload.new;
    
    console.log('[Contacts Realtime] 👤 Novo lead detectado:', {
      leadId: leadData.id,
      name: leadData.name,
      phone: leadData.phone,
      instanceId: leadData.whatsapp_number_id
    });

    // Filtrar por instância
    if (activeInstanceId && leadData.whatsapp_number_id !== activeInstanceId) {
      return;
    }

    // Notificar sobre novo contato
    if (onContactUpdate) {
      const newContact: Partial<Contact> = {
        id: leadData.id,
        name: leadData.name,
        phone: leadData.phone,
        email: leadData.email,
        lastMessage: 'Nova conversa iniciada',
        lastMessageTime: leadData.created_at,
        unreadCount: 1
      };
      
      console.log('[Contacts Realtime] ➕ Adicionando novo contato:', newContact);
      onContactUpdate(leadData.id, newContact);
    }
  }, [activeInstanceId, onContactUpdate]);

  // ✅ CONFIGURAR REALTIME
  useEffect(() => {
    if (!enabled || !userId || !activeInstanceId) {
      cleanup();
      return;
    }

    console.log('[Contacts Realtime] 🚀 Configurando realtime para contatos:', {
      userId,
      activeInstanceId
    });

    // Cleanup anterior
    cleanup();

    // Criar novo canal
    const channelId = `contacts-realtime-${userId}-${activeInstanceId}-${Date.now()}`;

    const channel = supabase
      .channel(channelId)
      
      // 📨 SUBSCRIPTION PARA NOVAS MENSAGENS
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `whatsapp_number_id=eq.${activeInstanceId}`
      }, handleNewMessage)
      
      // 👤 SUBSCRIPTION PARA NOVOS LEADS
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leads',
        filter: `whatsapp_number_id=eq.${activeInstanceId}`
      }, handleNewLead)
      
      .subscribe((status) => {
        console.log('[Contacts Realtime] 📡 Status da conexão:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('[Contacts Realtime] ✅ Realtime de contatos ativo');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Contacts Realtime] ❌ Erro no canal de contatos');
        }
      });

    channelRef.current = channel;

    return cleanup;
  }, [enabled, userId, activeInstanceId, handleNewMessage, handleNewLead, cleanup]);

  // ✅ CLEANUP GERAL
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isConnected: !!channelRef.current
  };
};
