
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';

interface UseRealtimeLeadsProps {
  selectedContact: Contact | null;
  fetchContacts: () => Promise<void>;
  fetchMessages?: () => Promise<void>;
  receiveNewLead: (lead: any) => void;
  activeInstanceId: string | null;
}

/**
 * Hook consolidado para escutar leads e mensagens em tempo real
 * Corrigido para evitar múltiplas subscrições
 */
export const useRealtimeLeads = ({
  selectedContact,
  fetchContacts,
  fetchMessages,
  receiveNewLead,
  activeInstanceId
}: UseRealtimeLeadsProps) => {
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!activeInstanceId) {
      // Cleanup if no active instance
      if (channelRef.current) {
        console.log('[Realtime Leads] Cleaning up channel - no active instance');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
      return;
    }

    // Prevent duplicate subscriptions
    if (isSubscribedRef.current && channelRef.current) {
      console.log('[Realtime Leads] Subscription already active, skipping');
      return;
    }

    console.log('[Realtime Leads] Setting up consolidated subscription for instance:', activeInstanceId);

    // Clean up existing channel first
    if (channelRef.current) {
      console.log('[Realtime Leads] Removing existing channel before creating new one');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    // Canal único para todas as operações de tempo real
    channelRef.current = supabase
      .channel(`unified-realtime-${activeInstanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `whatsapp_number_id=eq.${activeInstanceId}`
        },
        (payload) => {
          console.log('[Realtime Leads] New lead received:', payload);
          
          const newLead = payload.new as any;
          receiveNewLead(newLead);
          
          // Refresh contacts list
          fetchContacts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `whatsapp_number_id=eq.${activeInstanceId}`
        },
        (payload) => {
          console.log('[Realtime Leads] Lead updated (sync unread_count):', payload);
          
          // Refresh contacts list when leads are updated
          fetchContacts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `whatsapp_number_id=eq.${activeInstanceId}`
        },
        (payload) => {
          console.log('[Realtime Leads] New message received:', payload);
          
          const newMessage = payload.new as any;
          
          // Se a mensagem é para o contato selecionado, atualizar mensagens
          if (selectedContact && newMessage.lead_id === selectedContact.id) {
            console.log('[Realtime Leads] Message for selected contact, updating messages');
            if (fetchMessages) {
              fetchMessages();
            }
          }
          
          // Sempre atualizar a lista de contatos para mostrar a nova mensagem
          console.log('[Realtime Leads] Updating contact list');
          fetchContacts();
        }
      )
      .subscribe((status) => {
        console.log('[Realtime Leads] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Realtime Leads] Subscription failed:', status);
          isSubscribedRef.current = false;
        }
      });

    return () => {
      console.log('[Realtime Leads] Cleaning up consolidated subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      isSubscribedRef.current = false;
    };
  }, [selectedContact, activeInstanceId, fetchContacts, fetchMessages, receiveNewLead]);
};
