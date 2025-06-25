import { useEffect, useRef, useCallback } from 'react';
import { useRealtimeManager } from '../realtime/useRealtimeManager';
import { Contact } from '@/types/chat';

interface UseRealtimeLeadsProps {
  selectedContact: Contact | null;
  fetchContacts: () => Promise<void>;
  fetchMessages?: () => Promise<void>;
  receiveNewLead: (lead: any) => void;
  activeInstanceId: string | null;
}

export const useRealtimeLeads = ({
  selectedContact,
  fetchContacts,
  fetchMessages,
  receiveNewLead,
  activeInstanceId
}: UseRealtimeLeadsProps) => {
  const { registerCallback, unregisterCallback } = useRealtimeManager();
  const hookId = useRef(`realtime-leads-${Date.now()}`).current;

  // Estabilizar callbacks com useRef para evitar dependency hell
  const fetchContactsRef = useRef(fetchContacts);
  const fetchMessagesRef = useRef(fetchMessages);
  const receiveNewLeadRef = useRef(receiveNewLead);
  
  fetchContactsRef.current = fetchContacts;
  fetchMessagesRef.current = fetchMessages;
  receiveNewLeadRef.current = receiveNewLead;

  // Callbacks estáveis para evitar re-registros
  const handleLeadInsert = useCallback((payload: any) => {
    console.log('[Realtime Leads] New lead received:', payload);
    const newLead = payload.new as any;
    receiveNewLeadRef.current(newLead);
    fetchContactsRef.current();
  }, []);

  const handleLeadUpdate = useCallback((payload: any) => {
    console.log('[Realtime Leads] Lead updated:', payload);
    fetchContactsRef.current();
  }, []);

  const handleMessageInsert = useCallback((payload: any) => {
    console.log('[Realtime Leads] New message received:', payload);
    const newMessage = payload.new as any;
    
    if (selectedContact && newMessage.lead_id === selectedContact.id) {
      console.log('[Realtime Leads] Message for selected contact, updating messages');
      if (fetchMessagesRef.current) {
        fetchMessagesRef.current();
      }
    }
    
    console.log('[Realtime Leads] Updating contact list');
    fetchContactsRef.current();
  }, [selectedContact?.id]); // Apenas selectedContact.id como dependência

  useEffect(() => {
    console.log('[Realtime Leads] Registering callbacks with hookId:', hookId);

    // Register callbacks
    registerCallback(`${hookId}-lead-insert`, 'leadInsert', handleLeadInsert);
    registerCallback(`${hookId}-lead-update`, 'leadUpdate', handleLeadUpdate);
    registerCallback(`${hookId}-message-insert`, 'messageInsert', handleMessageInsert, {
      activeInstanceId: activeInstanceId
    });

    return () => {
      console.log('[Realtime Leads] Cleanup callbacks with hookId:', hookId);
      unregisterCallback(`${hookId}-lead-insert`);
      unregisterCallback(`${hookId}-lead-update`);
      unregisterCallback(`${hookId}-message-insert`);
    };
  }, [activeInstanceId, registerCallback, unregisterCallback, hookId, handleLeadInsert, handleLeadUpdate, handleMessageInsert]);
};
