
// FASE 3: Realtime para chat WhatsApp Web.js
import { useEffect } from 'react';
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '../useWhatsAppWebInstances';
import { supabase } from "@/integrations/supabase/client";

export const useWhatsAppChatRealtime = (
  activeInstance: WhatsAppWebInstance | null,
  selectedContact: Contact | null,
  fetchMessages: () => Promise<void>,
  fetchContacts: () => Promise<void>,
  moveContactToTop: (contactId: string) => void,
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>
) => {
  useEffect(() => {
    if (!activeInstance) return;

    console.log('[WhatsApp Chat Realtime FASE 3] 🔔 Setting up realtime for instance:', activeInstance.id);

    // Listen for new messages
    const messagesChannel = supabase
      .channel(`messages-${activeInstance.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `whatsapp_number_id=eq.${activeInstance.id}`
        },
        async (payload) => {
          console.log('[WhatsApp Chat Realtime FASE 3] 📨 New message received:', payload);
          
          const newMessage = payload.new as any;
          
          // If message is for selected contact, refresh messages
          if (selectedContact && newMessage.lead_id === selectedContact.id) {
            console.log('[WhatsApp Chat Realtime FASE 3] 🔄 Refreshing messages for selected contact');
            await fetchMessages();
          }
          
          // Move contact to top and refresh contact list
          if (newMessage.lead_id) {
            moveContactToTop(newMessage.lead_id);
            await fetchContacts();
          }
        }
      )
      .subscribe();

    // Listen for lead updates (last message, unread count, etc.)
    const leadsChannel = supabase
      .channel(`leads-${activeInstance.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `whatsapp_number_id=eq.${activeInstance.id}`
        },
        async (payload) => {
          console.log('[WhatsApp Chat Realtime FASE 3] 📝 Lead updated:', payload);
          await fetchContacts();
        }
      )
      .subscribe();

    // Listen for new leads
    const newLeadsChannel = supabase
      .channel(`new-leads-${activeInstance.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `whatsapp_number_id=eq.${activeInstance.id}`
        },
        async (payload) => {
          console.log('[WhatsApp Chat Realtime FASE 3] 🆕 New lead created:', payload);
          await fetchContacts();
        }
      )
      .subscribe();

    return () => {
      console.log('[WhatsApp Chat Realtime FASE 3] 🧹 Cleaning up realtime subscriptions');
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(newLeadsChannel);
    };
  }, [activeInstance, selectedContact, fetchMessages, fetchContacts, moveContactToTop]);
};
