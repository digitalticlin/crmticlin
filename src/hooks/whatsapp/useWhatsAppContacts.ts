/**
 * 🎯 HOOK ISOLADO PARA CONTATOS WHATSAPP
 * 
 * RESPONSABILIDADES:
 * ✅ Gerenciar lista de contatos
 * ✅ Cache isolado da feature
 * ✅ Paginação e busca
 * ✅ Operações CRUD de contatos
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseWhatsAppContactsParams {
  activeInstanceId?: string | null;
}

interface UseWhatsAppContactsReturn {
  contacts: Contact[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMoreContacts: boolean;
  totalContactsAvailable: number;
  loadMoreContacts: () => Promise<void>;
  refreshContacts: () => void;
  moveContactToTop: (contactId: string, newMessage?: any) => void;
  updateUnreadCount: (contactId: string, increment?: boolean) => void;
  addNewContact: (newContactData: Partial<Contact>) => void;
  getContactById: (contactId: string) => Contact | null;
  searchContacts: (query: string) => Contact[];
}

const CONTACTS_LIMIT = 50;
const CACHE_DURATION = 60 * 1000; // 1 minuto

export const useWhatsAppContacts = ({ 
  activeInstanceId 
}: UseWhatsAppContactsParams = {}): UseWhatsAppContactsReturn => {
  const { user } = useAuth();
  
  // Estados isolados da feature
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreContacts, setHasMoreContacts] = useState(true);
  const [totalContactsAvailable, setTotalContactsAvailable] = useState(0);
  
  // Cache isolado da feature
  const cache = useRef<Map<string, {
    data: Contact[];
    timestamp: number;
    hasMore: boolean;
    total: number;
  }>>(new Map());
  
  // Controle de estado isolado
  const lastActiveInstanceRef = useRef<string | undefined>(activeInstanceId || undefined);
  const isLoadingRef = useRef(false);
  const currentOffsetRef = useRef(0);

  // Chave de cache isolada
  const cacheKey = useMemo(() => {
    const isAdmin = user?.id ? true : false; // Simplificado para o hook isolado
    return isAdmin ? `admin-${user?.id}` : `${activeInstanceId || 'none'}-${user?.id}`;
  }, [activeInstanceId, user?.id]);

  // Buscar contatos (isolado)
  const fetchContacts = useCallback(async (offset = 0, forceRefresh = false) => {
    if (isLoadingRef.current || !user?.id) return;
    
    // Verificar cache primeiro (apenas para primeira página)
    if (offset === 0 && !forceRefresh && cache.current.has(cacheKey)) {
      const cached = cache.current.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('[WhatsApp Contacts] 💾 Usando cache isolado');
        setContacts(cached.data);
        setHasMoreContacts(cached.hasMore);
        setTotalContactsAvailable(cached.total);
        return;
      }
    }

    try {
      isLoadingRef.current = true;
      
      if (offset === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      console.log('[WhatsApp Contacts] 🔍 Buscando contatos isoladamente:', {
        offset,
        activeInstanceId,
        userId: user.id
      });

      // Query isolada para contatos - incluindo foto de perfil
      let query = supabase
        .from('leads')
        .select(`
          id,
          name,
          phone,
          email,
          address,
          company,
          document_id,
          notes,
          purchase_value,
          owner_id,
          last_message,
          last_message_time,
          unread_count,
          created_at,
          updated_at,
          whatsapp_number_id,
          kanban_stage_id,
          created_by_user_id,
          profile_pic_url
        `)
        .eq('created_by_user_id', user.id)
        .order('last_message_time', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      // Filtrar por instância se fornecida
      if (activeInstanceId) {
        query = query.eq('whatsapp_number_id', activeInstanceId);
      }

      const { data: leadsData, error, count } = await query
        .range(offset, offset + CONTACTS_LIMIT - 1);

      if (error) throw error;

      // Buscar tags para todos os leads
      let tagsMap: Record<string, any[]> = {};
      if (leadsData && leadsData.length > 0) {
        const leadIds = leadsData.map(lead => lead.id);
        
        const { data: tagsData } = await supabase
          .from('lead_tags')
          .select(`
            lead_id,
            tags!inner (
              id,
              name,
              color,
              created_by_user_id
            )
          `)
          .in('lead_id', leadIds)
          .eq('tags.created_by_user_id', user.id);

        // Organizar tags por lead_id
        (tagsData || []).forEach(tagRelation => {
          if (!tagsMap[tagRelation.lead_id]) {
            tagsMap[tagRelation.lead_id] = [];
          }
          if (tagRelation.tags) {
            tagsMap[tagRelation.lead_id].push(tagRelation.tags);
          }
        });
      }

      // Converter para formato Contact - incluindo foto de perfil
      const fetchedContacts: Contact[] = (leadsData || []).map(lead => ({
        id: lead.id,
        name: lead.name || null,
        phone: lead.phone || '',
        email: lead.email,
        address: lead.address,
        company: lead.company,
        documentId: lead.document_id,
        notes: lead.notes,
        purchaseValue: lead.purchase_value,
        assignedUser: lead.owner_id,
        lastMessage: lead.last_message,
        lastMessageTime: lead.last_message_time,
        unreadCount: lead.unread_count && lead.unread_count > 0 ? lead.unread_count : undefined,
        leadId: lead.id,
        whatsapp_number_id: lead.whatsapp_number_id || undefined,
        stageId: lead.kanban_stage_id || null,
        createdAt: lead.created_at,
        tags: tagsMap[lead.id] || [],
        instanceInfo: undefined,
        avatar: lead.profile_pic_url || undefined, // 🚀 Foto de perfil do lead
        profilePicUrl: lead.profile_pic_url || undefined
      }));

      if (offset === 0) {
        setContacts(fetchedContacts);
        
        // Atualizar cache isolado
        cache.current.set(cacheKey, {
          data: fetchedContacts,
          timestamp: Date.now(),
          hasMore: fetchedContacts.length === CONTACTS_LIMIT,
          total: count || 0
        });
      } else {
        setContacts(prev => [...prev, ...fetchedContacts]);
      }

      setHasMoreContacts(fetchedContacts.length === CONTACTS_LIMIT);
      setTotalContactsAvailable(count || 0);
      currentOffsetRef.current = offset + fetchedContacts.length;

      console.log('[WhatsApp Contacts] ✅ Contatos carregados isoladamente:', {
        count: fetchedContacts.length,
        total: count,
        activeInstanceId,
        userId: user.id,
        firstContact: fetchedContacts[0] ? {
          id: fetchedContacts[0].id,
          name: fetchedContacts[0].name,
          phone: fetchedContacts[0].phone,
          leadId: fetchedContacts[0].leadId,
          instanceInfo: fetchedContacts[0].instanceInfo
        } : null
      });

    } catch (error: any) {
      console.error('[WhatsApp Contacts] ❌ Erro ao carregar contatos:', error);
      toast.error('Erro ao carregar contatos');
      
      if (offset === 0) {
        setContacts([]);
      }
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [activeInstanceId, user?.id, cacheKey]);

  // Carregar mais contatos
  const loadMoreContacts = useCallback(async () => {
    if (hasMoreContacts && !isLoadingRef.current) {
      await fetchContacts(currentOffsetRef.current);
    }
  }, [hasMoreContacts, fetchContacts]);

  // Refresh contatos
  const refreshContacts = useCallback(() => {
    // Invalidar cache
    cache.current.delete(cacheKey);
    currentOffsetRef.current = 0;
    fetchContacts(0, true);
  }, [fetchContacts, cacheKey]);

  // Mover contato para o topo (isolado)
  const moveContactToTop = useCallback((contactId: string, newMessage?: any) => {
    console.log('[WhatsApp Contacts] 🔝 Movendo contato para topo (isolado):', contactId);
    
    setContacts(prevContacts => {
      if (!prevContacts || prevContacts.length === 0) return prevContacts;
      
      const contactIndex = prevContacts.findIndex(contact => contact.id === contactId);
      if (contactIndex === -1) {
        console.log('[WhatsApp Contacts] ⚠️ Contato não encontrado:', contactId);
        return prevContacts;
      }
      
      const updatedContacts = [...prevContacts];
      const [contactToMove] = updatedContacts.splice(contactIndex, 1);
      
      // Atualizar com nova mensagem se fornecida
      if (newMessage) {
        contactToMove.lastMessage = newMessage.text || newMessage.body || '';
        contactToMove.lastMessageTime = newMessage.created_at || newMessage.timestamp || new Date().toISOString();
        
        // Incrementar unread_count apenas se for mensagem recebida
        if (!newMessage.from_me && !newMessage.fromMe) {
          contactToMove.unreadCount = (contactToMove.unreadCount || 0) + 1;
        }
      }
      
      // Mover para o topo
      updatedContacts.unshift(contactToMove);
      
      // Atualizar cache isolado
      if (cache.current.has(cacheKey)) {
        const cached = cache.current.get(cacheKey)!;
        cache.current.set(cacheKey, {
          ...cached,
          data: updatedContacts,
          timestamp: Date.now()
        });
      }
      
      return updatedContacts;
    });
  }, [cacheKey]);

  // Atualizar contador de mensagens não lidas
  const updateUnreadCount = useCallback((contactId: string, increment: boolean = true) => {
    setContacts(prevContacts => 
      prevContacts.map(contact => {
        if (contact.id === contactId || contact.leadId === contactId) {
          const currentCount = contact.unreadCount || 0;
          const newCount = increment ? currentCount + 1 : 0;
          
          console.log('[WhatsApp Contacts] 🔢 Atualizando contador (isolado):', {
            contactName: contact.name,
            oldCount: currentCount,
            newCount,
            increment
          });
          
          return {
            ...contact,
            unreadCount: newCount > 0 ? newCount : undefined
          };
        }
        return contact;
      })
    );
  }, []);

  // Adicionar novo contato
  const addNewContact = useCallback((newContactData: Partial<Contact>) => {
    if (!newContactData.id && !newContactData.leadId) {
      console.error('[WhatsApp Contacts] ❌ Novo contato sem ID válido');
      return;
    }

    const newContact: Contact = {
      id: newContactData.id || newContactData.leadId || '',
      name: newContactData.name || 'Novo Contato',
      phone: newContactData.phone || '',
      email: newContactData.email,
      lastMessage: newContactData.lastMessage,
      lastMessageTime: newContactData.lastMessageTime || new Date().toISOString(),
      unreadCount: newContactData.unreadCount || 1,
      leadId: newContactData.leadId || newContactData.id,
      stageId: newContactData.stageId || null,
      createdAt: newContactData.createdAt || new Date().toISOString(),
      tags: newContactData.tags || [],
      instanceInfo: newContactData.instanceInfo
    };

    setContacts(prevContacts => {
      // Verificar se contato já existe
      const existingIndex = prevContacts.findIndex(c => 
        c.id === newContact.id || c.leadId === newContact.leadId
      );
      
      if (existingIndex !== -1) {
        console.log('[WhatsApp Contacts] ⚠️ Contato já existe, movendo para topo');
        moveContactToTop(newContact.id, {
          text: newContact.lastMessage || '',
          timestamp: newContact.lastMessageTime,
          unreadCount: newContact.unreadCount
        });
        return prevContacts;
      }
      
      console.log('[WhatsApp Contacts] ➕ Adicionando novo contato (isolado):', newContact.name);
      return [newContact, ...prevContacts];
    });
  }, [moveContactToTop]);

  // Buscar contato por ID
  const getContactById = useCallback((contactId: string): Contact | null => {
    return contacts.find(c => c.id === contactId || c.leadId === contactId) || null;
  }, [contacts]);

  // Buscar contatos por query
  const searchContacts = useCallback((query: string): Contact[] => {
    if (!query.trim()) return contacts;
    
    const lowerQuery = query.toLowerCase();
    return contacts.filter(contact => 
      contact.name?.toLowerCase().includes(lowerQuery) ||
      contact.phone.includes(lowerQuery) ||
      (contact.lastMessage && contact.lastMessage.toLowerCase().includes(lowerQuery))
    );
  }, [contacts]);

  // Effect para carregar contatos quando instância ativa muda
  useEffect(() => {
    if (lastActiveInstanceRef.current !== activeInstanceId) {
      lastActiveInstanceRef.current = activeInstanceId;
      currentOffsetRef.current = 0;
      fetchContacts(0, true);
    }
  }, [activeInstanceId, fetchContacts]);

  // Carregamento inicial
  useEffect(() => {
    if (user?.id) {
      fetchContacts(0);
    }
  }, [user?.id, fetchContacts]);

  return {
    contacts,
    isLoading,
    isLoadingMore,
    hasMoreContacts,
    totalContactsAvailable,
    loadMoreContacts,
    refreshContacts,
    moveContactToTop,
    updateUnreadCount,
    addNewContact,
    getContactById,
    searchContacts
  };
};