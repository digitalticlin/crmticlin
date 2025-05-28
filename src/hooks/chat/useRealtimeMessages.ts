
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
            onNewMessage();
          }
          
          // Sempre atualizar a lista de contatos para mostrar a nova mensagem
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
