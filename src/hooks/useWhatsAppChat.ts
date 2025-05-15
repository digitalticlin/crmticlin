
import { useState } from 'react';
import { Contact } from '@/types/chat';
import { useWhatsAppInstanceState } from '@/hooks/whatsapp/whatsappInstanceStore';
import { supabase } from "@/integrations/supabase/client";
import { useWhatsAppContacts } from './whatsapp/useWhatsAppContacts';
import { useWhatsAppMessages } from './whatsapp/useWhatsAppMessages';
import { useCompanyResolver } from './whatsapp/useCompanyResolver';
import { useContactNotes } from './whatsapp/useContactNotes';

// NOVO FLUXO: NENHUM POLLING/FETCH AUTOMÁTICO!
export const useWhatsAppChat = (userEmail: string) => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Get active WhatsApp instance
  const { instances } = useWhatsAppInstanceState();
  const activeInstance = instances.length > 0 ? instances[0] : null;

  // Get user company ID
  const companyId = useCompanyResolver(userEmail);

  // Get contacts (sem refresh automático)
  const {
    contacts,
    fetchContacts,
    isLoadingContacts
  } = useWhatsAppContacts(activeInstance, companyId);

  // Get messages (sem refresh automático)
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

  // ─── REMOVIDO: Não existe mais polling automático de contatos ou mensagens ──

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
    fetchContacts,   // Disponível apenas para caso manual/emergencial
    fetchMessages
  };
};
