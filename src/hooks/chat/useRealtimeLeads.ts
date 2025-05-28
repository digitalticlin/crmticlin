import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';
import { useRealtimeMessages } from './useRealtimeMessages';

interface UseRealtimeLeadsProps {
  selectedContact: Contact | null;
  fetchContacts: () => Promise<void>;
  fetchMessages?: () => Promise<void>;
  receiveNewLead: (lead: any) => void;
}

/**
 * Hook para escutar leads e mensagens em tempo real
 */
export const useRealtimeLeads = ({
  selectedContact,
  fetchContacts,
  fetchMessages,
  receiveNewLead,
}: UseRealtimeLeadsProps) => {

  // Get active instance ID (assuming first instance for now)
  // TODO: This should be improved to get the actual active instance
  const activeInstanceId = selectedContact?.id ? "instance-id" : null; // Placeholder

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
    console.log('[Realtime Leads] Setting up leads subscription');

    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads'
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
          table: 'leads'
        },
        (payload) => {
          console.log('[Realtime Leads] Lead updated:', payload);
          
          // Refresh contacts list when leads are updated
          fetchContacts();
        }
      )
      .subscribe();

    return () => {
      console.log('[Realtime Leads] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [fetchContacts, receiveNewLead]);
};
