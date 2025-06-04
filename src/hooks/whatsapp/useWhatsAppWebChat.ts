
import { useState, useEffect, useCallback } from 'react';
import { Contact } from '@/types/chat';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebInstance } from './useWhatsAppWebInstances';
import { toast } from "sonner";
import { useFakeContacts } from './chat/useFakeContacts';
import { useContactSorting } from './chat/useContactSorting';
import { useContactMovement } from './chat/useContactMovement';
import { useWhatsAppChatMessages } from './chat/useWhatsAppChatMessages';
import { useWhatsAppChatRealtime } from './chat/useWhatsAppChatRealtime';

/**
 * Hook especializado para chat WhatsApp Web.js - experiência real
 */
export const useWhatsAppWebChat = (activeInstance: WhatsAppWebInstance | null) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Hooks auxiliares
  const { getFakeContacts } = useFakeContacts();
  const { sortContacts } = useContactSorting();
  const { moveContactToTop } = useContactMovement();
  
  // Hook de mensagens
  const {
    messages,
    isLoadingMessages,
    isSending,
    fetchMessages,
    sendMessage
  } = useWhatsAppChatMessages(selectedContact, activeInstance);

  // Buscar contatos (leads) da instância ativa
  const fetchContacts = useCallback(async () => {
    if (!activeInstance) {
      // Se não há instância ativa, mostrar contatos fake para demonstração
      const fakeContacts = getFakeContacts();
      const sortedContacts = sortContacts(fakeContacts);
      setContacts(sortedContacts);
      return;
    }

    setIsLoadingContacts(true);
    try {
      console.log('[WhatsApp Web Chat] 📋 Fetching contacts for instance:', activeInstance.id);

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
        .eq('company_id', activeInstance.company_id)
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
      const fakeContacts = getFakeContacts();
      const allContacts = [...mappedContacts, ...fakeContacts];

      const sortedContacts = sortContacts(allContacts);
      console.log('[WhatsApp Web Chat] ✅ Contacts fetched and sorted:', sortedContacts.length);
      setContacts(sortedContacts);
    } catch (error) {
      console.error('[WhatsApp Web Chat] ❌ Error fetching contacts:', error);
      // Em caso de erro, mostrar pelo menos os contatos fake
      const fakeContacts = getFakeContacts();
      const sortedContacts = sortContacts(fakeContacts);
      setContacts(sortedContacts);
      toast.error('Erro ao carregar contatos - mostrando dados de demonstração');
    } finally {
      setIsLoadingContacts(false);
    }
  }, [activeInstance, sortContacts, getFakeContacts]);

  // Configurar realtime para novas mensagens
  useWhatsAppChatRealtime(
    activeInstance,
    selectedContact,
    fetchMessages,
    fetchContacts,
    moveContactToTop,
    setContacts
  );

  // Carregar contatos quando instância mudar
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Carregar mensagens quando contato selecionado mudar
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage,
    isLoadingContacts,
    isLoadingMessages,
    isSending,
    fetchContacts,
    fetchMessages
  };
};
