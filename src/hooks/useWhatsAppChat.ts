
import { useState } from 'react';
import { Contact } from '@/types/chat';
import { useWhatsAppInstanceState } from '@/hooks/whatsapp/whatsappInstanceStore';
import { useWhatsAppContacts } from './whatsapp/useWhatsAppContacts';
import { useWhatsAppMessages } from './whatsapp/useWhatsAppMessages';
import { useCompanyResolver } from './whatsapp/useCompanyResolver';
import { useContactNotes } from './whatsapp/useContactNotes';

// Novo fluxo: carrega dados do banco de dados e escuta real-time
export const useWhatsAppChat = (userEmail: string) => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Get active WhatsApp instance
  const { instances } = useWhatsAppInstanceState();
  const activeInstance = instances.length > 0 ? instances[0] : null;

  // Get user company ID
  const companyId = useCompanyResolver(userEmail);

  // Get contacts (carrega do banco)
  const {
    contacts,
    fetchContacts,
    isLoadingContacts
  } = useWhatsAppContacts(activeInstance, companyId);

  // Get messages (carrega do banco)
  const {
    messages,
    fetchMessages,
    sendMessage,
    isLoadingMessages,
    isSending
  } = useWhatsAppMessages(activeInstance, selectedContact);

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
    fetchMessages
  };
};
