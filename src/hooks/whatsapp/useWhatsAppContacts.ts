
import { useState, useCallback } from 'react';
import { Contact } from '@/types/chat';
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para gerenciar contatos WhatsApp — carrega leads do banco de dados
 */
export const useWhatsAppContacts = (activeInstance: any, companyId: string | null) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Carregar contatos/leads do banco de dados
  const fetchContacts = useCallback(async () => {
    if (!activeInstance || !companyId || isLoadingContacts) return;
    setIsLoadingContacts(true);

    try {
      // Buscar leads da tabela leads filtrados por whatsapp_number_id e company_id
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('whatsapp_number_id', activeInstance.id)
        .eq('company_id', companyId)
        .order('last_message_time', { ascending: false });

      if (error) {
        console.error("Error fetching leads:", error);
        return;
      }

      if (leads && leads.length > 0) {
        const mappedContacts: Contact[] = leads.map(lead => ({
          id: lead.id,
          name: lead.name || `Contato: ${formatPhoneNumber(lead.phone)}`,
          phone: formatPhoneNumber(lead.phone),
          email: lead.email || "",
          address: lead.address || "",
          company: lead.company || "",
          notes: lead.notes || "",
          lastMessage: lead.last_message || "",
          lastMessageTime: lead.last_message_time 
            ? new Date(lead.last_message_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            : "Agora",
          unreadCount: lead.unread_count || 0,
          avatar: "", // No avatar in database yet
          isOnline: false // We don't track online status yet
        }));

        setContacts(mappedContacts);
      }
    } catch (error) {
      console.error("Error fetching WhatsApp contacts:", error);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [activeInstance, companyId, isLoadingContacts]);

  /**
   * Helper function to format phone number for display
   */
  const formatPhoneNumber = (phone: string): string => {
    // Simple formatting, can be enhanced for different country codes
    if (phone.startsWith('55')) {
      // Brazilian format
      if (phone.length === 12 || phone.length === 13) {
        // With area code
        const areaCode = phone.substring(2, 4);
        const firstPart = phone.substring(4, phone.length - 4);
        const lastPart = phone.substring(phone.length - 4);
        return `+55 ${areaCode} ${firstPart}-${lastPart}`;
      }
    }
    return `+${phone}`;
  };

  return {
    contacts,
    fetchContacts,
    isLoadingContacts,
    setContacts
  };
};
