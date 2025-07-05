
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
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Callbacks estáveis com throttling rigoroso
  const handleLeadInsert = useCallback((payload: any) => {
    console.log('[Realtime Leads] New lead received:', payload);
    
    // Throttling para evitar spam
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
    }
    
    throttleTimerRef.current = setTimeout(() => {
      const newLead = payload.new as any;
      receiveNewLead(newLead);
      fetchContacts();
    }, 500); // Reduzido para 500ms
  }, [receiveNewLead, fetchContacts]);

  const handleLeadUpdate = useCallback((payload: any) => {
    console.log('[Realtime Leads] Lead updated:', payload);
    
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
    }
    
    throttleTimerRef.current = setTimeout(() => {
      fetchContacts();
    }, 500); // Reduzido para 500ms
  }, [fetchContacts]);

  const handleMessageInsert = useCallback((payload: any) => {
    console.log('[Realtime Leads] New message received:', payload);
    const newMessage = payload.new as any;
    
    // Throttling mais rigoroso para mensagens
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
    }
    
    throttleTimerRef.current = setTimeout(() => {
      if (selectedContact && newMessage.lead_id === selectedContact.id) {
        console.log('[Realtime Leads] Message for selected contact, updating messages');
        if (fetchMessages) {
          fetchMessages();
        }
      }
      
      console.log('[Realtime Leads] Updating contact list');
      fetchContacts();
    }, 300); // Reduzido para 300ms para mensagens
  }, [selectedContact?.id, fetchContacts, fetchMessages]);

  useEffect(() => {
    console.log('[Realtime Leads] Registering callbacks with hookId:', hookId);

    // Register callbacks com IDs únicos
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
      
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
    };
  }, [activeInstanceId, registerCallback, unregisterCallback, hookId, handleLeadInsert, handleLeadUpdate, handleMessageInsert]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
    };
  }, []);
};
