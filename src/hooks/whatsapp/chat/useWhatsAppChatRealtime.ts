
import { useUnifiedRealtime } from '../../realtime/useUnifiedRealtime';
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

  const handleMessageInsert = async (payload: any) => {
    console.log('[WhatsApp Chat Realtime] New message received:', payload);
    
    const newMessage = payload.new as any;
    
    // If message is for selected contact, refresh messages
    if (selectedContact && newMessage.lead_id === selectedContact.id) {
      console.log('[WhatsApp Chat Realtime] Refreshing messages for selected contact');
      await fetchMessages();
    }
    
    // Move contact to top and refresh contact list
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

  useUnifiedRealtime({
    onMessageInsert: handleMessageInsert,
    onLeadUpdate: handleLeadUpdate,
    onLeadInsert: handleLeadInsert,
    activeInstanceId: activeInstance?.id || null
  });
};
