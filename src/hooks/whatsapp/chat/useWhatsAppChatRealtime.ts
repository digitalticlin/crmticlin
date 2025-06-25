import { useEffect, useRef, useCallback } from 'react';
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
  const hookId = useRef(`whatsapp-chat-realtime-${Date.now()}`).current;
  
  // Estabilizar callbacks com useRef para evitar re-registros
  const fetchMessagesRef = useRef(fetchMessages);
  const fetchContactsRef = useRef(fetchContacts);
  const moveContactToTopRef = useRef(moveContactToTop);
  
  fetchMessagesRef.current = fetchMessages;
  fetchContactsRef.current = fetchContacts;
  moveContactToTopRef.current = moveContactToTop;

  // Callbacks estáveis que não causam re-renders
  const handleMessageInsert = useCallback(async (payload: any) => {
    console.log('[WhatsApp Chat Realtime] New message received:', payload);
    
    const newMessage = payload.new as any;
    
    if (selectedContact && newMessage.lead_id === selectedContact.id) {
      console.log('[WhatsApp Chat Realtime] Refreshing messages for selected contact');
      await fetchMessagesRef.current();
    }
    
    if (newMessage.lead_id) {
      moveContactToTopRef.current(newMessage.lead_id);
      await fetchContactsRef.current();
    }
  }, [selectedContact?.id]); // Apenas selectedContact.id como dependência

  const handleLeadUpdate = useCallback(async (payload: any) => {
    console.log('[WhatsApp Chat Realtime] Lead updated:', payload);
    await fetchContactsRef.current();
  }, []);

  const handleLeadInsert = useCallback(async (payload: any) => {
    console.log('[WhatsApp Chat Realtime] New lead created:', payload);
    await fetchContactsRef.current();
  }, []);

  useEffect(() => {
    if (!activeInstance?.id) return;

    console.log('[WhatsApp Chat Realtime] Registering callbacks for instance:', activeInstance.id);

    registerCallback(`${hookId}-message-insert`, 'messageInsert', handleMessageInsert, {
      activeInstanceId: activeInstance.id
    });
    registerCallback(`${hookId}-lead-update`, 'leadUpdate', handleLeadUpdate);
    registerCallback(`${hookId}-lead-insert`, 'leadInsert', handleLeadInsert);

    return () => {
      console.log('[WhatsApp Chat Realtime] Cleanup callbacks for instance:', activeInstance.id);
      unregisterCallback(`${hookId}-message-insert`);
      unregisterCallback(`${hookId}-lead-update`);
      unregisterCallback(`${hookId}-lead-insert`);
    };
  }, [activeInstance?.id, registerCallback, unregisterCallback, hookId, handleMessageInsert, handleLeadUpdate, handleLeadInsert]);
};
