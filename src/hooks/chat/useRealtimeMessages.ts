
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';

interface UseRealtimeMessagesProps {
  selectedContact: Contact | null;
  activeInstanceId: string | null;
  onNewMessage: () => void;
  onContactUpdate: () => void;
}

/**
 * Hook para escutar mensagens em tempo real via Supabase
 * Agora com foco em sincronização de unread_count
 */
export const useRealtimeMessages = ({
  selectedContact,
  activeInstanceId,
  onNewMessage,
  onContactUpdate
}: UseRealtimeMessagesProps) => {
  
  useEffect(() => {
    if (!activeInstanceId) return;

    console.log('[Realtime Messages] Setting up subscription for instance:', activeInstanceId);

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `whatsapp_number_id=eq.${activeInstanceId}`
        },
        (payload) => {
          console.log('[Realtime Messages] New message received:', payload);
          
          const newMessage = payload.new as any;
          
          // Se a mensagem é para o contato selecionado, atualizar mensagens
          if (selectedContact && newMessage.lead_id === selectedContact.id) {
            console.log('[Realtime Messages] Message for selected contact, updating messages');
            onNewMessage();
          }
          
          // Sempre atualizar a lista de contatos para mostrar a nova mensagem
          console.log('[Realtime Messages] Updating contact list');
          onContactUpdate();
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
          console.log('[Realtime Messages] Lead updated (unread_count sync):', payload);
          
          // Atualizar contatos quando unread_count for modificado
          onContactUpdate();
        }
      )
      .subscribe();

    return () => {
      console.log('[Realtime Messages] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [selectedContact, activeInstanceId, onNewMessage, onContactUpdate]);
};
