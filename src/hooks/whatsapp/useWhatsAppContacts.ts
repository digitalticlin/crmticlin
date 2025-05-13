
import { useState, useCallback } from 'react';
import { Contact } from '@/types/chat';
import { evolutionApiService } from '@/services/evolution-api';
import { useChatDatabase } from '@/hooks/whatsapp/useChatDatabase';

/**
 * Hook for managing WhatsApp contacts
 */
export const useWhatsAppContacts = (activeInstance: any, companyId: string | null) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  
  // Database operations
  const { saveChatsAsLeads } = useChatDatabase();
  
  // Fetch contacts (chats)
  const fetchContacts = useCallback(async () => {
    if (!activeInstance || !companyId || isLoadingContacts) return;
    
    setIsLoadingContacts(true);
    
    try {
      const chats = await evolutionApiService.findChats(activeInstance.instanceName);
      
      if (chats && chats.length > 0) {
        // Save chats as leads in the database
        const contacts = await saveChatsAsLeads(companyId, activeInstance.id, chats);
        setContacts(contacts);
      }
    } catch (error) {
      console.error("Error fetching WhatsApp contacts:", error);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [activeInstance, companyId, isLoadingContacts, saveChatsAsLeads]);
  
  return {
    contacts,
    fetchContacts,
    isLoadingContacts,
    setContacts
  };
};
