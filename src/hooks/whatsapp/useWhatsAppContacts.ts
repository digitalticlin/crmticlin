
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';
import { toast } from 'sonner';

interface UseWhatsAppContactsProps {
  instanceId?: string;
}

export const useWhatsAppContacts = (instanceId?: string) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreContacts, setHasMoreContacts] = useState(true);
  const [totalContactsAvailable, setTotalContactsAvailable] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const CONTACTS_PER_PAGE = 50;
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  // ✅ CONVERSÃO DE LEAD PARA CONTATO
  const convertLeadToContact = useCallback((lead: any): Contact => {
    return {
      id: lead.id,
      leadId: lead.id,
      name: lead.name || lead.phone || 'Contato',
      phone: lead.phone,
      email: lead.email,
      company: lead.company,
      address: lead.address,
      notes: lead.notes,
      lastMessage: lead.last_message || '',
      lastMessageTime: lead.last_message_time || lead.created_at,
      unreadCount: lead.unread_count || 0,
      tags: [],
      stageId: lead.kanban_stage_id,
      ownerId: lead.owner_id,
      createdAt: lead.created_at,
      instanceInfo: {
        name: lead.whatsapp_instances?.instance_name || 'Instância',
        status: lead.whatsapp_instances?.connection_status || 'disconnected',
        phone: lead.whatsapp_instances?.phone || ''
      }
    };
  }, []);

  // ✅ BUSCAR CONTATOS COM RETRY
  const fetchContacts = useCallback(async (offset = 0) => {
    if (!instanceId) {
      setContacts([]);
      return { contacts: [], hasMore: false, total: 0 };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      console.log('[WhatsApp Contacts] 📥 Buscando contatos:', { 
        instanceId, 
        offset, 
        limit: CONTACTS_PER_PAGE 
      });

      // Query otimizada
      const { data, error, count } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          phone,
          email,
          company,
          address,
          notes,
          last_message,
          last_message_time,
          unread_count,
          kanban_stage_id,
          owner_id,
          created_at,
          whatsapp_instances!inner (
            instance_name,
            connection_status,
            phone
          )
        `, { count: 'exact' })
        .eq('whatsapp_number_id', instanceId)
        .order('last_message_time', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + CONTACTS_PER_PAGE - 1)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        console.error('[WhatsApp Contacts] ❌ Erro ao buscar contatos:', error);
        throw error;
      }

      const convertedContacts = (data || []).map(convertLeadToContact);
      
      console.log('[WhatsApp Contacts] ✅ Contatos convertidos:', {
        count: convertedContacts.length,
        total: count,
        hasMore: (offset + convertedContacts.length) < (count || 0)
      });

      retryCountRef.current = 0; // Reset retry count on success

      return {
        contacts: convertedContacts,
        hasMore: (offset + convertedContacts.length) < (count || 0),
        total: count || 0
      };

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('[WhatsApp Contacts] ⏱️ Timeout na busca de contatos');
        throw new Error('Timeout ao carregar contatos');
      }
      
      console.error('[WhatsApp Contacts] ❌ Erro na busca:', error);
      throw error;
    }
  }, [instanceId, convertLeadToContact]);

  // ✅ CARREGAR CONTATOS INICIAIS
  const loadInitialContacts = useCallback(async () => {
    if (!instanceId) {
      setContacts([]);
      setHasMoreContacts(true);
      setTotalContactsAvailable(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchContacts(0);
      
      setContacts(result.contacts);
      setHasMoreContacts(result.hasMore);
      setTotalContactsAvailable(result.total);
      
    } catch (error: any) {
      console.error('[WhatsApp Contacts] ❌ Erro ao carregar contatos iniciais:', error);
      
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        console.log(`[WhatsApp Contacts] 🔄 Tentativa ${retryCountRef.current}/${MAX_RETRIES}`);
        setTimeout(() => loadInitialContacts(), 2000 * retryCountRef.current);
        return;
      }
      
      setError(error.message || 'Erro ao carregar contatos');
      setContacts([]);
      toast.error('Falha ao carregar contatos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [instanceId, fetchContacts]);

  // ✅ CARREGAR MAIS CONTATOS
  const loadMoreContacts = useCallback(async () => {
    if (!instanceId || !hasMoreContacts || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const result = await fetchContacts(contacts.length);
      
      if (result.contacts.length > 0) {
        setContacts(prev => [...prev, ...result.contacts]);
        setHasMoreContacts(result.hasMore);
      } else {
        setHasMoreContacts(false);
      }
      
    } catch (error: any) {
      console.error('[WhatsApp Contacts] ❌ Erro ao carregar mais contatos:', error);
      toast.error('Erro ao carregar mais contatos');
    } finally {
      setIsLoadingMore(false);
    }
  }, [instanceId, contacts.length, hasMoreContacts, isLoadingMore, fetchContacts]);

  // ✅ ATUALIZAR CONTATO ESPECÍFICO
  const updateContact = useCallback((contactId: string, updates: Partial<Contact>) => {
    setContacts(prev => 
      prev.map(contact => 
        contact.id === contactId 
          ? { ...contact, ...updates }
          : contact
      )
    );
  }, []);

  // ✅ MOVER CONTATO PARA TOPO
  const moveContactToTop = useCallback((contactId: string, newMessage?: any) => {
    setContacts(prev => {
      const contactIndex = prev.findIndex(c => c.id === contactId);
      if (contactIndex === -1) return prev;
      
      const contact = prev[contactIndex];
      const updatedContact = {
        ...contact,
        ...(newMessage && {
          lastMessage: newMessage.text || newMessage.lastMessage,
          lastMessageTime: newMessage.timestamp || newMessage.lastMessageTime || new Date().toISOString()
        })
      };
      
      const newContacts = [...prev];
      newContacts.splice(contactIndex, 1);
      newContacts.unshift(updatedContact);
      
      return newContacts;
    });
  }, []);

  // ✅ ADICIONAR NOVO CONTATO
  const addNewContact = useCallback((newContactData: Partial<Contact>) => {
    const newContact: Contact = {
      id: newContactData.id || '',
      leadId: newContactData.leadId || newContactData.id || '',
      name: newContactData.name || 'Novo Contato',
      phone: newContactData.phone || '',
      email: newContactData.email,
      company: newContactData.company,
      address: newContactData.address,
      notes: newContactData.notes,
      lastMessage: newContactData.lastMessage || 'Nova conversa',
      lastMessageTime: newContactData.lastMessageTime || new Date().toISOString(),
      unreadCount: newContactData.unreadCount || 1,
      tags: newContactData.tags || [],
      stageId: newContactData.stageId,
      ownerId: newContactData.ownerId,
      createdAt: newContactData.createdAt || new Date().toISOString()
    };
    
    setContacts(prev => [newContact, ...prev]);
    setTotalContactsAvailable(prev => prev + 1);
  }, []);

  // ✅ CARREGAR QUANDO INSTÂNCIA MUDAR
  useEffect(() => {
    loadInitialContacts();
  }, [loadInitialContacts]);

  return {
    contacts,
    isLoading,
    isLoadingMore,
    hasMoreContacts,
    totalContactsAvailable,
    error,
    loadMoreContacts,
    refreshContacts: loadInitialContacts,
    updateContact,
    moveContactToTop,
    addNewContact
  };
};
