import { useState, useEffect } from 'react';
import { Contact } from '@/types/chat';
import { useWhatsAppInstanceState } from '@/hooks/whatsapp/whatsappInstanceStore';
import { supabase } from "@/integrations/supabase/client";
import { useWhatsAppContacts } from './whatsapp/useWhatsAppContacts';
import { useWhatsAppMessages } from './whatsapp/useWhatsAppMessages';
import { useCompanyResolver } from './whatsapp/useCompanyResolver';
import { useContactNotes } from './whatsapp/useContactNotes';

export const useWhatsAppChat = (userEmail: string) => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Get active WhatsApp instance
  const { instances } = useWhatsAppInstanceState();
  const activeInstance = instances.length > 0 ? instances[0] : null;
  
  // Get user company ID
  const companyId = useCompanyResolver(userEmail);
  
  // Get contacts
  const { 
    contacts, 
    fetchContacts, 
    isLoadingContacts 
  } = useWhatsAppContacts(activeInstance, companyId);
  
  // Get messages
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
  
  // Poll for new chats every 3 seconds
  useEffect(() => {
    if (!activeInstance || !companyId) return;
    
    fetchContacts();
    
    const interval = setInterval(() => {
      fetchContacts();
      setLastRefresh(new Date());
    }, 3000);
    
    return () => clearInterval(interval);
  }, [activeInstance, companyId, fetchContacts]);
  
  // Poll for new messages every 3 seconds when a contact is selected
  useEffect(() => {
    if (!selectedContact || !activeInstance) return;
    
    fetchMessages();
    
    const interval = setInterval(() => {
      fetchMessages();
      setLastRefresh(new Date());
    }, 3000);
    
    return () => clearInterval(interval);
  }, [selectedContact, activeInstance, fetchMessages]);
  
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
    fetchContacts,   // já estava exportando
    fetchMessages    // agora expõe para uso manual
  };
};
