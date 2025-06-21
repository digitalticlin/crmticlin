
import { useEffect } from 'react';
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

  useEffect(() => {
    if (!activeInstanceId) return;

    console.log('[Realtime Leads] Setting up consolidated subscription for instance:', activeInstanceId);

    // Canal único para todas as operações de tempo real
    const channel = supabase
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
      .subscribe();

    return () => {
      console.log('[Realtime Leads] Cleaning up consolidated subscription');
      supabase.removeChannel(channel);
    };
  }, [selectedContact, activeInstanceId, fetchContacts, fetchMessages, receiveNewLead]);
};
