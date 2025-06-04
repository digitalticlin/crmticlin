
// FASE 3: Hook otimizado para contatos WhatsApp
import { useState, useCallback } from 'react';
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from './useWhatsAppWebInstances';
import { supabase } from "@/integrations/supabase/client";
import { useFakeContacts } from './chat/useFakeContacts';
import { useContactSorting } from './chat/useContactSorting';

export const useWhatsAppContacts = (
  activeInstance: WhatsAppWebInstance | null,
  companyId: string | null
) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  
  const { getFakeContacts } = useFakeContacts();
  const { sortContacts } = useContactSorting();

  const fetchContacts = useCallback(async () => {
    if (!activeInstance || !companyId) {
      // Se não há instância ativa, mostrar contatos fake para demonstração
      const fakeContacts = getFakeContacts();
      const sortedContacts = sortContacts(fakeContacts);
      setContacts(sortedContacts);
      return;
    }

    setIsLoadingContacts(true);
    try {
      console.log('[WhatsApp Contacts FASE 3] 📋 Fetching contacts for instance:', activeInstance.id);

      const { data: leads, error } = await supabase
        .from('leads')
        .select(`
          *,
          lead_tags!inner(
            tag_id,
            tags(name, color)
          )
        `)
        .eq('whatsapp_number_id', activeInstance.id)
        .eq('company_id', companyId)
        .order('last_message_time', { ascending: false, nullsFirst: false });

      if (error) throw error;

      const mappedContacts: Contact[] = (leads || []).map(lead => {
        // Extrair tags do relacionamento
        const leadTags = lead.lead_tags?.map((lt: any) => lt.tags?.name).filter(Boolean) || [];
        
        return {
          id: lead.id,
          name: lead.name || `+${lead.phone}`,
          phone: lead.phone,
          email: lead.email || '',
          address: lead.address || '',
          company: lead.company || '',
          notes: lead.notes || '',
          tags: leadTags,
          lastMessage: lead.last_message || '',
          lastMessageTime: lead.last_message_time 
            ? new Date(lead.last_message_time).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            : '',
          unreadCount: lead.unread_count || 0,
          avatar: '',
          isOnline: Math.random() > 0.7 // Simulação básica de status online
        };
      });

      // Se não há leads reais, adicionar contatos fake para demonstração
      if (mappedContacts.length === 0) {
        const fakeContacts = getFakeContacts();
        const allContacts = [...mappedContacts, ...fakeContacts];
        const sortedContacts = sortContacts(allContacts);
        setContacts(sortedContacts);
      } else {
        const sortedContacts = sortContacts(mappedContacts);
        setContacts(sortedContacts);
      }

      console.log('[WhatsApp Contacts FASE 3] ✅ Contacts fetched and sorted:', contacts.length);
    } catch (error) {
      console.error('[WhatsApp Contacts FASE 3] ❌ Error fetching contacts:', error);
      // Em caso de erro, mostrar pelo menos os contatos fake
      const fakeContacts = getFakeContacts();
      const sortedContacts = sortContacts(fakeContacts);
      setContacts(sortedContacts);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [activeInstance, companyId, sortContacts, getFakeContacts]);

  return {
    contacts,
    setContacts,
    fetchContacts,
    isLoadingContacts
  };
};
