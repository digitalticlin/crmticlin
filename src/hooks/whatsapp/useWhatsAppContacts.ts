
import { useState, useCallback } from 'react';
import { Contact } from '@/types/chat';
import { evolutionApiService } from '@/services/evolution-api';
import { useChatDatabase } from '@/hooks/whatsapp/useChatDatabase';

/**
 * Hook para gerenciar contatos WhatsApp — SÓ busca quando chamado manualmente!
 */
export const useWhatsAppContacts = (activeInstance: any, companyId: string | null) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const { saveChatsAsLeads } = useChatDatabase();

  // NÃO chame esse método automaticamente — só use manualmente!
  const fetchContacts = useCallback(async () => {
    if (!activeInstance || !companyId || isLoadingContacts) return;
    setIsLoadingContacts(true);

    try {
      const chats = await evolutionApiService.findChats(activeInstance.instanceName);
      if (chats && chats.length > 0) {
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
