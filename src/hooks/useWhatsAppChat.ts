
import { useState } from 'react';
import { Contact } from '@/types/chat';
import { useWhatsAppInstanceState } from '@/hooks/whatsapp/whatsappInstanceStore';
import { useWhatsAppContacts } from './whatsapp/useWhatsAppContacts';
import { useWhatsAppMessages } from './whatsapp/useWhatsAppMessages';
import { useCompanyResolver } from './whatsapp/useCompanyResolver';
import { useContactNotes } from './whatsapp/useContactNotes';

// Hook simplificado para WhatsApp Web.js apenas
export const useWhatsAppChat = (userEmail: string) => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Get active WhatsApp Web.js instance
  const { instances } = useWhatsAppInstanceState();
  const activeInstance = instances.find(i => i.connection_type === 'web') || null;

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
