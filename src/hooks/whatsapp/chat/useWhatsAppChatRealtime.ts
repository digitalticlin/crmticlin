
import { useEffect, useRef } from 'react';
import { useRealtimeManager } from '../../realtime/useRealtimeManager';
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';

export const useWhatsAppChatRealtime = (
  activeInstance: WhatsAppWebInstance | null,
  selectedContact: Contact | null,
  fetchMessages: () => Promise<void>,
  fetchContacts: () => Promise<void>,
  moveContactToTop: (contactId: string) => void,
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>
) => {
  const { registerCallback, unregisterCallback } = useRealtimeManager();
  const hookId = useRef(`whatsapp-chat-realtime-${Math.random()}`).current;

  useEffect(() => {
    const handleMessageInsert = async (payload: any) => {
      console.log('[WhatsApp Chat Realtime] New message received:', payload);
      
      const newMessage = payload.new as any;
      
      if (selectedContact && newMessage.lead_id === selectedContact.id) {
        console.log('[WhatsApp Chat Realtime] Refreshing messages for selected contact');
        await fetchMessages();
      }
      
      if (newMessage.lead_id) {
        moveContactToTop(newMessage.lead_id);
        await fetchContacts();
      }
    };

    const handleLeadUpdate = async (payload: any) => {
      console.log('[WhatsApp Chat Realtime] Lead updated:', payload);
      await fetchContacts();
    };

    const handleLeadInsert = async (payload: any) => {
      console.log('[WhatsApp Chat Realtime] New lead created:', payload);
      await fetchContacts();
    };

    registerCallback(`${hookId}-message-insert`, 'messageInsert', handleMessageInsert, activeInstance?.id || null);
    registerCallback(`${hookId}-lead-update`, 'leadUpdate', handleLeadUpdate);
    registerCallback(`${hookId}-lead-insert`, 'leadInsert', handleLeadInsert);

    return () => {
      unregisterCallback(`${hookId}-message-insert`);
      unregisterCallback(`${hookId}-lead-update`);
      unregisterCallback(`${hookId}-lead-insert`);
    };
  }, [activeInstance?.id, selectedContact, fetchMessages, fetchContacts, moveContactToTop, registerCallback, unregisterCallback, hookId]);
};
