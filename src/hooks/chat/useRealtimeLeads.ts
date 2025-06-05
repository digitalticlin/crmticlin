
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';
import { useRealtimeMessages } from './useRealtimeMessages';

interface UseRealtimeLeadsProps {
  selectedContact: Contact | null;
  fetchContacts: () => Promise<void>;
  fetchMessages?: () => Promise<void>;
  receiveNewLead: (lead: any) => void;
  activeInstanceId: string | null;
}

/**
 * Hook para escutar leads e mensagens em tempo real
 * Agora otimizado para sincronização de unread_count
 */
export const useRealtimeLeads = ({
  selectedContact,
  fetchContacts,
  fetchMessages,
  receiveNewLead,
  activeInstanceId
}: UseRealtimeLeadsProps) => {

  // Setup realtime messages subscription
  useRealtimeMessages({
    selectedContact,
    activeInstanceId,
    onNewMessage: async () => {
      if (fetchMessages) {
        await fetchMessages();
      }
    },
    onContactUpdate: async () => {
      await fetchContacts();
    }
  });

  useEffect(() => {
    if (!activeInstanceId) return;

    console.log('[Realtime Leads] Setting up leads subscription for instance:', activeInstanceId);

    const channel = supabase
      .channel('leads-changes')
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
          
          // Refresh contacts list when leads are updated (principalmente unread_count)
          fetchContacts();
        }
      )
      .subscribe();

    return () => {
      console.log('[Realtime Leads] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [fetchContacts, receiveNewLead, activeInstanceId]);
};
