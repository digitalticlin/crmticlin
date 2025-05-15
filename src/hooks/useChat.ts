
import { useState } from "react"; // For contactDetailsOpen
import { useWhatsAppChat } from "./useWhatsAppChat";
import { useSalesFunnel } from "./useSalesFunnel";
import { useUserEmail } from "./chat/useUserEmail";
import { useContactNotesManager } from "./chat/useContactNotesManager";
import { useRealtimeLeads } from "./chat/useRealtimeLeads";
import { useChatActions } from "./chat/useChatActions";

export function useChat() {
  // User Email Management
  const { userEmail } = useUserEmail();

  // UI State for Contact Details Drawer
  const [contactDetailsOpen, setContactDetailsOpen] = useState(false);

  // Sales Funnel (for receiving new leads)
  const { receiveNewLead } = useSalesFunnel();

  // Core WhatsApp Chat Functionality
  const {
    contacts: whatsappContacts,
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage: sendMessageWhatsApp, // Renamed to avoid conflict in useChatActions
    fetchContacts,
    isLoadingContacts: isLoadingWhatsAppContacts,
    isLoadingMessages,
    fetchMessages,
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
    fetchContacts,
    fetchMessages,
    receiveNewLead,
  });

  // Chat Actions (Send Message, Manual Refresh)
  const {
    handleSendMessage,
    handleManualRefresh,
    isManualLoading,
  } = useChatActions({
    selectedContact,
    sendMessageWhatsApp, // Pass the renamed function
    fetchContacts,
    fetchMessages,
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
    isLoadingContacts: isLoadingWhatsAppContacts || isManualLoading, // Combined loading state
    isLoadingMessages,
    handleManualRefresh,
  };
}
