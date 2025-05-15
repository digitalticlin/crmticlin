import { useState, useEffect, useCallback } from "react";
import { useWhatsAppChat } from "./useWhatsAppChat";
import { Contact } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";

export function useChat() {
  // State for user email
  const [userEmail, setUserEmail] = useState<string>("");

  // State for contact details drawer
  const [contactDetailsOpen, setContactDetailsOpen] = useState(false);

  // State for contact notes
  const [contactNotes, setContactNotes] = useState("");

  // Manual loading state for full refresh
  const [manualLoading, setManualLoading] = useState(false);

  // WhatsApp chat integration
  const {
    contacts: whatsappContacts,
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage,
    fetchContacts,
    isLoadingContacts,
    isLoadingMessages,
  } = useWhatsAppChat(userEmail);

  // Use only real WhatsApp contacts
  const contacts = whatsappContacts;

  // Load user email on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
      }
    };

    getUser();
  }, []);

  // Load contact notes when a contact is selected
  useEffect(() => {
    const loadContactNotes = async () => {
      if (selectedContact) {
        try {
          const { data: lead } = await supabase
            .from('leads')
            .select('notes')
            .eq('id', selectedContact.id)
            .single();

          if (lead) {
            setContactNotes(lead.notes || "");
          }
        } catch (error) {
          console.error("Error loading contact notes:", error);
        }
      }
    };

    loadContactNotes();
  }, [selectedContact]);

  // Handler for updating contact notes
  const handleUpdateContactNotes = async () => {
    if (!selectedContact) return;

    try {
      await supabase
        .from('leads')
        .update({ notes: contactNotes })
        .eq('id', selectedContact.id);

      setSelectedContact({
        ...selectedContact,
        notes: contactNotes
      });
    } catch (error) {
      console.error("Error updating contact notes:", error);
    }
  };

  // Handler for sending a message
  const handleSendMessage = (text: string) => {
    if (!selectedContact) return;
    sendMessage(text);
  };

  // Manual chats refresh handler
  const handleManualRefresh = useCallback(async () => {
    setManualLoading(true);
    try {
      await fetchContacts();
    } finally {
      setManualLoading(false);
    }
  }, [fetchContacts]);

  // Expor loading consolidando loading do chat e manual loading (usado pra exibir spinner)
  return {
    contacts: whatsappContacts,
    setContacts: () => {},
    selectedContact,
    setSelectedContact,
    messages,
    contactDetailsOpen,
    setContactDetailsOpen,
    contactNotes,
    setContactNotes,
    updateContactNotes: handleUpdateContactNotes,
    sendMessage: handleSendMessage,
    isLoadingContacts: isLoadingContacts || manualLoading,
    isLoadingMessages,
    handleManualRefresh
  };
}
