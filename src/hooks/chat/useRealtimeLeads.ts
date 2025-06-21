
import { useEffect, useRef } from 'react';
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
  const hookId = useRef(`realtime-leads-${Math.random()}`).current;

  useEffect(() => {
    const handleLeadInsert = (payload: any) => {
      console.log('[Realtime Leads] New lead received:', payload);
      const newLead = payload.new as any;
      receiveNewLead(newLead);
      fetchContacts();
    };

    const handleLeadUpdate = (payload: any) => {
      console.log('[Realtime Leads] Lead updated:', payload);
      fetchContacts();
    };

    const handleMessageInsert = (payload: any) => {
      console.log('[Realtime Leads] New message received:', payload);
      const newMessage = payload.new as any;
      
      if (selectedContact && newMessage.lead_id === selectedContact.id) {
        console.log('[Realtime Leads] Message for selected contact, updating messages');
        if (fetchMessages) {
          fetchMessages();
        }
      }
      
      console.log('[Realtime Leads] Updating contact list');
      fetchContacts();
    };

    // Register callbacks
    registerCallback(`${hookId}-lead-insert`, 'leadInsert', handleLeadInsert);
    registerCallback(`${hookId}-lead-update`, 'leadUpdate', handleLeadUpdate);
    registerCallback(`${hookId}-message-insert`, 'messageInsert', handleMessageInsert, activeInstanceId);

    return () => {
      unregisterCallback(`${hookId}-lead-insert`);
      unregisterCallback(`${hookId}-lead-update`);
      unregisterCallback(`${hookId}-message-insert`);
    };
  }, [selectedContact, fetchContacts, fetchMessages, receiveNewLead, activeInstanceId, registerCallback, unregisterCallback, hookId]);
};
