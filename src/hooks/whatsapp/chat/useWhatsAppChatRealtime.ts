
import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebInstance } from '../useWhatsAppWebInstances';
import { Contact } from '@/types/chat';

/**
 * Hook para configurar realtime do chat WhatsApp Web
 */
export const useWhatsAppChatRealtime = (
  activeInstance: WhatsAppWebInstance | null,
  selectedContact: Contact | null,
  fetchMessages: () => Promise<void>,
  fetchContacts: () => Promise<void>,
  moveContactToTop: (contactId: string, setContacts: React.Dispatch<React.SetStateAction<Contact[]>>) => void,
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>
) => {
  useEffect(() => {
    if (!activeInstance) return;

    console.log('[WhatsApp Web Chat] 🔄 Setting up realtime for instance:', activeInstance.id);

    const channel = supabase
      .channel('whatsapp-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `whatsapp_number_id=eq.${activeInstance.id}`
        },
        (payload) => {
          console.log('[WhatsApp Web Chat] 🔄 Nova mensagem recebida via realtime:', payload);
          
          const newMessage = payload.new as any;
          
          // Mover contato para o topo se recebeu nova mensagem
          if (newMessage.lead_id && !newMessage.from_me) {
            moveContactToTop(newMessage.lead_id, setContacts);
          }
          
          // Se é mensagem do contato selecionado, atualizar mensagens
          if (selectedContact && newMessage.lead_id === selectedContact.id) {
            console.log('[WhatsApp Web Chat] Updating messages for selected contact');
            fetchMessages();
          }
          
          // Sempre atualizar lista de contatos
          console.log('[WhatsApp Web Chat] Updating contacts list');
          fetchContacts();
        }
      )
      .subscribe();

    return () => {
      console.log('[WhatsApp Web Chat] 🧹 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [activeInstance, selectedContact, fetchMessages, fetchContacts, moveContactToTop, setContacts]);
};
