
import { useState } from "react"; // For contactDetailsOpen
import { useWhatsAppChat } from "./useWhatsAppChat";
import { useUserEmail } from "./chat/useUserEmail";
import { useContactNotesManager } from "./chat/useContactNotesManager";
import { useRealtimeLeads } from "./chat/useRealtimeLeads";
import { useChatActions } from "./chat/useChatActions";

export function useChat() {
  // User Email Management
  const { userEmail } = useUserEmail();

  // UI State for Contact Details Drawer
  const [contactDetailsOpen, setContactDetailsOpen] = useState(false);

  // Core WhatsApp Chat Functionality
  const {
    contacts: whatsappContacts,
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage: sendMessageWhatsApp,
    fetchContacts,
    isLoadingContacts: isLoadingWhatsAppContacts,
    isLoadingMessages,
    fetchMessages,
    activeInstance
  } = useWhatsAppChat(userEmail);

  // Contact Notes Management
  const {
    contactNotes,
    setContactNotes,
    handleUpdateContactNotes,
  } = useContactNotesManager({ selectedContact, setSelectedContact });

  // Realtime Lead Subscription (runs its own useEffect)
  useRealtimeLeads({
    selectedContact,
    fetchContacts: async () => fetchContacts(),
    fetchMessages: async () => selectedContact ? fetchMessages() : Promise.resolve(),
    receiveNewLead: () => {}, // Stub function - no longer dependent on sales funnel
    activeInstanceId: activeInstance?.id || null
  });

  // Chat Actions (Send Message, Manual Refresh)
  const {
    handleSendMessage,
    handleManualRefresh,
    isManualLoading,
  } = useChatActions({
    selectedContact,
    sendMessageWhatsApp: (text: string) => sendMessageWhatsApp(text),
    fetchContacts: async () => fetchContacts(),
    fetchMessages: async () => selectedContact ? fetchMessages() : Promise.resolve(),
  });

  // The setContacts was a no-op, can be kept for API consistency or removed if unused
  const setContacts = () => { /* console.warn("setContacts is a no-op in useChat") */ };

  return {
    contacts: whatsappContacts,
    setContacts,
    selectedContact,
    setSelectedContact,
    messages,
    contactDetailsOpen,
    setContactDetailsOpen,
    contactNotes,
    setContactNotes,
    updateContactNotes: handleUpdateContactNotes,
    sendMessage: handleSendMessage,
    isLoadingContacts: isLoadingWhatsAppContacts || isManualLoading,
    isLoadingMessages,
    handleManualRefresh,
  };
}
