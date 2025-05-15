
import { useState, useCallback } from "react";
import { Contact } from "@/types/chat";

interface UseChatActionsProps {
  selectedContact: Contact | null;
  sendMessageWhatsApp: (text: string) => void;
  fetchContacts: () => Promise<void>;
  fetchMessages?: () => Promise<void>; // Optional as it depends on selectedContact in useWhatsAppChat
}

export function useChatActions({
  selectedContact,
  sendMessageWhatsApp,
  fetchContacts,
  fetchMessages,
}: UseChatActionsProps) {
  const [isManualLoading, setManualLoading] = useState(false);

  const handleSendMessage = (text: string) => {
    if (!selectedContact) {
      console.warn("No contact selected to send message.");
      return;
    }
    sendMessageWhatsApp(text);
  };

  const handleManualRefresh = useCallback(async () => {
    setManualLoading(true);
    try {
      await fetchContacts();
      if (selectedContact && fetchMessages) {
        await fetchMessages();
      }
    } catch (error) {
      console.error("Error during manual refresh:", error);
    } finally {
      setManualLoading(false);
    }
  }, [fetchContacts, fetchMessages, selectedContact]); // Dependencies for useCallback

  return {
    handleSendMessage,
    handleManualRefresh,
    isManualLoading,
  };
}
