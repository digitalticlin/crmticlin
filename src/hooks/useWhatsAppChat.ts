
import { useState } from 'react';
import { Contact } from '@/types/chat';
import { useWhatsAppDatabase } from './whatsapp/useWhatsAppDatabase';
import { useWhatsAppWebChat } from './whatsapp/useWhatsAppWebChat';
import { useCompanyResolver } from './whatsapp/useCompanyResolver';
import { useContactNotes } from './whatsapp/useContactNotes';

// DEPRECATED: Use useWhatsAppWebChat instead
// This hook is kept for backward compatibility but should be replaced
export const useWhatsAppChat = (userEmail: string) => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Get user company ID
  const companyId = useCompanyResolver(userEmail);

  // Use database-only approach
  const { instances, getActiveInstance } = useWhatsAppDatabase(companyId, false);
  const activeInstance = getActiveInstance();

  // Use the new WhatsApp Web chat hook
  const {
    contacts,
    messages,
    sendMessage,
    isLoadingContacts,
    isLoadingMessages,
    isSending,
    fetchContacts,
    fetchMessages
  } = useWhatsAppWebChat(activeInstance);

  // Get contact notes
  const {
    contactNotes,
    setContactNotes,
    updateContactNotes
  } = useContactNotes(selectedContact);

  // Update selected contact with changes like notes
  const updateSelectedContactData = (updates: Partial<Contact>) => {
    if (selectedContact) {
      setSelectedContact(prevContact => {
        if (!prevContact) return null;
        return { ...prevContact, ...updates };
      });
    }
  };

  return {
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage,
    isLoadingContacts,
    isLoadingMessages,
    isSending,
    lastRefresh,
    contactNotes,
    setContactNotes,
    updateContactNotes,
    fetchContacts,
    fetchMessages,
    activeInstance
  };
};
