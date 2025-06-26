
// FASE 3: Hook otimizado para contatos WhatsApp
import { useState, useCallback, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useFakeContacts } from './chat/useFakeContacts';
import { useLeadSorting } from './chat/useLeadSorting';

export const useWhatsAppContacts = (
  activeInstance: WhatsAppWebInstance | null,
  companyId: string | null
) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  
  const { getFakeContacts } = useFakeContacts();
  const { sortLeadsByRecentMessage } = useLeadSorting();

  const fetchContacts = useCallback(async () => {
    if (!activeInstance || !companyId) {
      // Se não há instância ativa, mostrar contatos fake para demonstração
      const fakeContacts = getFakeContacts();
      const sortedContacts = sortLeadsByRecentMessage(fakeContacts);
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
        .eq('created_by_user_id', companyId)
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
            ? new Date(lead.last_message_time).toISOString()
            : '',
          unreadCount: lead.unread_count && lead.unread_count > 0 ? lead.unread_count : undefined,
          avatar: '',
          profilePicUrl: lead.profile_pic_url || '', // Novo campo para foto de perfil do WhatsApp
          isOnline: Math.random() > 0.7 // Simulação básica de status online
        };
      });

      // Se não há leads reais, adicionar contatos fake para demonstração
      if (mappedContacts.length === 0) {
        const fakeContacts = getFakeContacts();
        const allContacts = [...mappedContacts, ...fakeContacts];
        const sortedContacts = sortLeadsByRecentMessage(allContacts);
        setContacts(sortedContacts);
      } else {
        // Aplicar ordenação por mensagem mais recente
        const sortedContacts = sortLeadsByRecentMessage(mappedContacts);
        setContacts(sortedContacts);
      }

      console.log('[WhatsApp Contacts FASE 3] ✅ Contacts fetched and sorted by recent message:', contacts.length);
    } catch (error) {
      console.error('[WhatsApp Contacts FASE 3] ❌ Error fetching contacts:', error);
      // Em caso de erro, mostrar pelo menos os contatos fake
      const fakeContacts = getFakeContacts();
      const sortedContacts = sortLeadsByRecentMessage(fakeContacts);
      setContacts(sortedContacts);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [activeInstance, companyId, sortLeadsByRecentMessage, getFakeContacts]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    setContacts,
    fetchContacts,
    isLoadingContacts
  };
};
