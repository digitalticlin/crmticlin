
import { useUnifiedRealtime } from '../realtime/useUnifiedRealtime';
import { Contact } from '@/types/chat';

interface UseRealtimeLeadsProps {
  selectedContact: Contact | null;
  fetchContacts: () => Promise<void>;
  fetchMessages?: () => Promise<void>;
  receiveNewLead: (lead: any) => void;
  activeInstanceId: string | null;
}

/**
 * Hook for lead realtime updates - now uses unified realtime manager
 */
export const useRealtimeLeads = ({
  selectedContact,
  fetchContacts,
  fetchMessages,
  receiveNewLead,
  activeInstanceId
}: UseRealtimeLeadsProps) => {

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
    
    // If message is for selected contact, update messages
    if (selectedContact && newMessage.lead_id === selectedContact.id) {
      console.log('[Realtime Leads] Message for selected contact, updating messages');
      if (fetchMessages) {
        fetchMessages();
      }
    }
    
    // Always update contact list
    console.log('[Realtime Leads] Updating contact list');
    fetchContacts();
  };

  useUnifiedRealtime({
    onLeadInsert: handleLeadInsert,
    onLeadUpdate: handleLeadUpdate,
    onMessageInsert: handleMessageInsert,
    activeInstanceId
  });
};
