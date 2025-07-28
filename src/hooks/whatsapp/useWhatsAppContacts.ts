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
  
  const CONTACTS_PER_PAGE = 20; // ✅ OTIMIZADO: Reduzido de 50 para 20
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  
  // ✅ CACHE DE INSTÂNCIA PARA EVITAR CONSULTAS REPETIDAS
  const instanceCacheRef = useRef<Map<string, any>>(new Map());

  // ✅ CONVERSÃO DE LEAD PARA CONTATO OTIMIZADA
  const convertLeadToContact = useCallback((lead: any, cachedInstanceData?: any): Contact => {
    const instanceData = cachedInstanceData || {
      instance_name: 'Instância',
      instance_status: 'disconnected',
      instance_phone: ''
    };

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
        name: instanceData.instance_name || 'Instância',
        status: instanceData.instance_status || 'disconnected',
        phone: instanceData.instance_phone || ''
      }
    };
  }, []);

  // ✅ BUSCAR CONTATOS COM CACHE DE INSTÂNCIA
  const fetchContacts = useCallback(async (offset = 0) => {
    if (!instanceId) {
      setContacts([]);
      return { contacts: [], hasMore: false, total: 0 };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // ✅ REDUZIDO: 15s → 10s

    try {
      console.log('[WhatsApp Contacts] 📥 Buscando contatos otimizados:', { 
        instanceId, 
        offset, 
        limit: CONTACTS_PER_PAGE 
      });

      // ✅ VERIFICAR CACHE DE INSTÂNCIA
      let instanceData = instanceCacheRef.current.get(instanceId);
      
      if (!instanceData) {
        console.log('[WhatsApp Contacts] 🔄 Carregando dados da instância no cache...');
        const { data: instanceInfo, error: instanceError } = await supabase
          .from('whatsapp_instances')
          .select('instance_name, connection_status, phone')
          .eq('id', instanceId)
          .single();

        if (!instanceError && instanceInfo) {
          instanceData = instanceInfo;
          instanceCacheRef.current.set(instanceId, instanceData);
        }
      }

      // ✅ QUERY OTIMIZADA COM MENOS DADOS
      const { data: leadsData, error: leadsError, count } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          phone,
          email,
          company,
          last_message,
          last_message_time,
          unread_count,
          kanban_stage_id,
          owner_id,
          created_at,
          whatsapp_number_id
        `, { count: 'exact' })
        .eq('whatsapp_number_id', instanceId)
        .order('last_message_time', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + CONTACTS_PER_PAGE - 1)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (leadsError) {
        console.error('[WhatsApp Contacts] ❌ Erro ao buscar leads:', leadsError);
        throw leadsError;
      }

      // ✅ CONVERSÃO COM CACHE
      const convertedContacts = (leadsData || []).map(lead => 
        convertLeadToContact(lead, instanceData)
      );
      
      console.log('[WhatsApp Contacts] ✅ Contatos convertidos (otimizados):', {
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

  // ✅ DEBOUNCED LOADING COM REDUÇÃO DE REQUESTS
  const debouncedLoadRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ CARREGAR CONTATOS INICIAIS COM DEBOUNCE
  const loadInitialContacts = useCallback(async () => {
    if (!instanceId) {
      setContacts([]);
      setHasMoreContacts(true);
      setTotalContactsAvailable(0);
      return;
    }

    // ✅ DEBOUNCE PARA EVITAR MÚLTIPLAS CALLS
    if (debouncedLoadRef.current) {
      clearTimeout(debouncedLoadRef.current);
    }

    debouncedLoadRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchContacts(0);
        
        setContacts(result.contacts);
        setHasMoreContacts(result.hasMore);
        setTotalContactsAvailable(result.total);
        
        console.log('[WhatsApp Contacts] ✅ Contatos carregados (com debounce):', {
          count: result.contacts.length,
          total: result.total
        });
        
      } catch (error: any) {
        console.error('[WhatsApp Contacts] ❌ Erro ao carregar contatos iniciais:', error);
        
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          console.log(`[WhatsApp Contacts] 🔄 Tentativa ${retryCountRef.current}/${MAX_RETRIES}`);
          
          // Retry com backoff exponencial
          const delay = Math.min(2000 * Math.pow(2, retryCountRef.current - 1), 10000);
          setTimeout(() => loadInitialContacts(), delay);
          return;
        }
        
        setError(error.message || 'Erro ao carregar contatos');
        setContacts([]);
        toast.error('Falha ao carregar contatos. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    }, 100); // ✅ DEBOUNCE DE 100ms
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
        
        console.log('[WhatsApp Contacts] ✅ Mais contatos carregados:', {
          newCount: result.contacts.length,
          totalNow: contacts.length + result.contacts.length
        });
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
    console.log('[WhatsApp Contacts] 🔄 Atualizando contato:', { contactId, updates });
    
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
    console.log('[WhatsApp Contacts] 🔝 Movendo contato para topo:', { contactId, newMessage });
    
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
    console.log('[WhatsApp Contacts] ➕ Adicionando novo contato:', newContactData);
    
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
    console.log('[WhatsApp Contacts] 🔄 Instância mudou, recarregando contatos:', instanceId);
    
    // ✅ LIMPAR CACHE AO MUDAR INSTÂNCIA
    instanceCacheRef.current.clear();
    
    loadInitialContacts();
  }, [loadInitialContacts]);

  // ✅ CLEANUP
  useEffect(() => {
    return () => {
      if (debouncedLoadRef.current) {
        clearTimeout(debouncedLoadRef.current);
      }
    };
  }, []);

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
