
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';
import { useRealtimeMessages } from './useRealtimeMessages';

interface UseRealtimeLeadsProps {
  selectedContact: Contact | null;
  fetchContacts: () => Promise<void>;
  fetchMessages?: () => Promise<void>;
  receiveNewLead: (lead: any) => void;
  activeInstanceId: string | null; // CORRIGIDO: Adicionado activeInstanceId
}

/**
 * Hook para escutar leads e mensagens em tempo real
 */
export const useRealtimeLeads = ({
  selectedContact,
  fetchContacts,
  fetchMessages,
  receiveNewLead,
  activeInstanceId // CORRIGIDO: Recebendo activeInstanceId
}: UseRealtimeLeadsProps) => {

  // Setup realtime messages subscription
  useRealtimeMessages({
    selectedContact,
    activeInstanceId, // CORRIGIDO: Passando activeInstanceId correto
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
          filter: `whatsapp_number_id=eq.${activeInstanceId}` // CORRIGIDO: Filtrar por instância
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
          filter: `whatsapp_number_id=eq.${activeInstanceId}` // CORRIGIDO: Filtrar por instância
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
  }, [fetchContacts, receiveNewLead, activeInstanceId]); // CORRIGIDO: Adicionado activeInstanceId nas dependências
};
