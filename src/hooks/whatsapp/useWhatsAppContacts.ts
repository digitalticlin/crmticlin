
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useWhatsAppDatabase } from '@/hooks/whatsapp/useWhatsAppDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const CONTACTS_LIMIT = 50;
const CACHE_DURATION = 60 * 1000; // 1 minuto

// Cache global para contatos
const contactsCache = new Map<string, { data: Contact[]; timestamp: number }>();

export const useWhatsAppContacts = (activeInstanceId?: string) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreContacts, setHasMoreContacts] = useState(true);
  const [totalContactsAvailable, setTotalContactsAvailable] = useState(0);
  
  const { permissions } = useUserPermissions();
  const { getActiveInstance } = useWhatsAppDatabase();
  const { user } = useAuth();
  const isAdmin = permissions.canViewAllData;
  
  // Refs para controle de estado
  const lastActiveInstanceRef = useRef<string | undefined>(activeInstanceId);
  const isLoadingRef = useRef(false);
  const currentOffsetRef = useRef(0);

  // Função para buscar contatos com query corrigida
  const fetchContacts = useCallback(async (offset = 0, forceRefresh = false) => {
    if (isLoadingRef.current) return;
    
    const currentInstance = activeInstanceId || getActiveInstance()?.id;
    
    console.log('[WhatsApp Contacts] 🔍 Fetching contacts:', {
      offset,
      forceRefresh,
      currentInstance,
      isAdmin,
      userId: user?.id
    });

    if (!currentInstance && !isAdmin) {
      console.log('[WhatsApp Contacts] ⚠️ No active instance for regular user');
      setContacts([]);
      return;
    }

    // Verificar cache
    const cacheKey = isAdmin ? `admin-${user?.id}` : `${currentInstance}-${user?.id}`;
    if (!forceRefresh && offset === 0) {
      const cached = contactsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('[WhatsApp Contacts] 💾 Using cached data');
        setContacts(cached.data);
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

      // 🚀 CORREÇÃO: Query simplificada sem junção problemática
        let query = supabase
          .from('leads')
          .select(`
          id,
          name,
          phone,
          email,
          last_message,
          last_message_time,
          unread_count,
          created_at,
          updated_at,
          whatsapp_number_id,
          kanban_stage_id,
          created_by_user_id
        `)
          .order('last_message_time', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });

      // 🚀 CORREÇÃO: Filtros mais simples e diretos
      if (isAdmin) {
        query = query.eq('created_by_user_id', user?.id);
        console.log('[WhatsApp Contacts] 🔒 Admin mode: filtrando por user_id:', user?.id);
      } else if (currentInstance) {
        query = query
          .eq('created_by_user_id', user?.id)
          .eq('whatsapp_number_id', currentInstance);
        console.log('[WhatsApp Contacts] 👤 User mode: filtrando por user_id + instance:', {
          userId: user?.id,
          instanceId: currentInstance
        });
      } else {
        console.log('[WhatsApp Contacts] ❌ Sem filtros válidos');
        setContacts([]);
        return;
      }

      console.log('[WhatsApp Contacts] 📡 Executando query com range:', {
        offset,
        limit: CONTACTS_LIMIT,
        total: offset + CONTACTS_LIMIT - 1
      });

      const { data: leadsData, error, count } = await query
        .range(offset, offset + CONTACTS_LIMIT - 1);

      if (error) {
        console.error('[WhatsApp Contacts] ❌ Query error:', error);
        throw error;
      }

      console.log('[WhatsApp Contacts] 📊 Query result:', {
        leadsCount: leadsData?.length || 0,
        totalCount: count,
        offset,
        hasData: !!leadsData,
        sampleLead: leadsData?.[0] ? {
          id: leadsData[0].id,
          name: leadsData[0].name,
          phone: leadsData[0].phone,
          whatsapp_number_id: leadsData[0].whatsapp_number_id
        } : null
      });

      // 🚀 CORREÇÃO: Conversão simplificada sem dependência de junção
      const fetchedContacts: Contact[] = (leadsData || []).map(lead => ({
            id: lead.id,
        name: lead.name || 'Contato sem nome',
        phone: lead.phone || '',
        email: lead.email,
        lastMessage: lead.last_message,
        lastMessageTime: lead.last_message_time,
        unreadCount: lead.unread_count && lead.unread_count > 0 ? lead.unread_count : undefined,
        leadId: lead.id,
        stageId: lead.kanban_stage_id || null,
        createdAt: lead.created_at,
        tags: [], // 🚀 SIMPLIFICADO: Tags serão carregadas separadamente se necessário
        instanceInfo: undefined // 🚀 SIMPLIFICADO: Info da instância não é crítica
      }));

      console.log('[WhatsApp Contacts] ✅ Contacts converted:', {
        originalCount: leadsData?.length || 0,
        convertedCount: fetchedContacts.length,
        firstContact: fetchedContacts[0] ? {
          id: fetchedContacts[0].id,
          name: fetchedContacts[0].name,
          phone: fetchedContacts[0].phone
        } : null
      });

      if (offset === 0) {
        setContacts(fetchedContacts);
        // Atualizar cache
        contactsCache.set(cacheKey, {
          data: fetchedContacts,
          timestamp: Date.now()
        });
      } else {
        setContacts(prev => [...prev, ...fetchedContacts]);
      }

      setHasMoreContacts(fetchedContacts.length === CONTACTS_LIMIT);
      setTotalContactsAvailable(count || 0);
      currentOffsetRef.current = offset + fetchedContacts.length;

    } catch (error: any) {
      console.error('[WhatsApp Contacts] ❌ Error fetching contacts:', error);
      toast.error('Erro ao carregar contatos');
      
      if (offset === 0) {
        setContacts([]);
      }
      } finally {
        isLoadingRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [activeInstanceId, getActiveInstance, isAdmin, user?.id]);

  // Função para carregar mais contatos
  const loadMoreContacts = useCallback(async () => {
    if (hasMoreContacts && !isLoadingRef.current) {
      await fetchContacts(currentOffsetRef.current);
    }
  }, [hasMoreContacts, fetchContacts]);

  // Função para refresh
  const refreshContacts = useCallback(async () => {
    currentOffsetRef.current = 0;
    await fetchContacts(0, true);
  }, [fetchContacts]);

  // 🚀 NOVA: Função para mover contato para topo sem resetar paginação
  const moveContactToTop = useCallback((contactId: string, newMessage?: { text: string; timestamp: string; unreadCount?: number }) => {
    setContacts(prevContacts => {
      const contactIndex = prevContacts.findIndex(c => c.id === contactId || c.leadId === contactId);
      
      if (contactIndex === -1) {
        console.log('[WhatsApp Contacts] ⚠️ Contato não encontrado para mover:', contactId);
        return prevContacts;
      }

      const contactToMove = { ...prevContacts[contactIndex] };
      
      // Atualizar informações da nova mensagem
      if (newMessage) {
        contactToMove.lastMessage = newMessage.text;
        contactToMove.lastMessageTime = newMessage.timestamp;
        contactToMove.unreadCount = newMessage.unreadCount || (contactToMove.unreadCount || 0) + 1;
      }
      
      // Remover contato da posição atual e adicionar no topo
      const newContacts = [...prevContacts];
      newContacts.splice(contactIndex, 1);
      newContacts.unshift(contactToMove);
      
      console.log('[WhatsApp Contacts] 🔝 Contato movido para topo:', {
        contactName: contactToMove.name,
        newMessage: newMessage?.text?.substring(0, 30),
        unreadCount: contactToMove.unreadCount
      });
      
      return newContacts;
    });
  }, []);

  // 🚀 NOVA: Função para atualizar contador de mensagens não lidas
  const updateUnreadCount = useCallback((contactId: string, increment: boolean = true) => {
    setContacts(prevContacts => 
      prevContacts.map(contact => {
        if (contact.id === contactId || contact.leadId === contactId) {
          const currentCount = contact.unreadCount || 0;
          const newCount = increment ? currentCount + 1 : 0;
          
          console.log('[WhatsApp Contacts] 🔢 Atualizando contador:', {
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

  // 🚀 NOVA: Função para adicionar novo contato ao topo
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
        return moveContactToTop(newContact.id, {
          text: newContact.lastMessage || '',
          timestamp: newContact.lastMessageTime,
          unreadCount: newContact.unreadCount
        });
      }
      
      console.log('[WhatsApp Contacts] ➕ Adicionando novo contato ao topo:', newContact.name);
      return [newContact, ...prevContacts];
    });
  }, [moveContactToTop]);

  // Efeito para carregar contatos quando instância ativa muda
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

  // ✅ LISTENER PARA REFRESH DE TAGS
  useEffect(() => {
    const handleRefreshTags = () => {
      console.log('[WhatsApp Contacts] 🏷️ Tags alteradas, fazendo refresh suave...');
      refreshContacts();
    };

    // ✅ NOVO LISTENER: Atualizar nome do contato no cache local
    const handleContactNameUpdate = (event: CustomEvent) => {
      const { leadId, contactId, newName, oldName } = event.detail;
      
      console.log('[WhatsApp Contacts] 📝 Nome do contato atualizado:', {
        leadId,
        contactId,
        newName,
        oldName
      });
      
      // Atualizar o contato no estado local imediatamente
      setContacts(prevContacts => 
        prevContacts.map(contact => {
          if (contact.leadId === leadId || contact.id === contactId) {
            console.log('[WhatsApp Contacts] ⚡ Atualizando nome local:', {
              contactId: contact.id,
              oldName: contact.name,
              newName
            });
            return { ...contact, name: newName };
          }
          return contact;
        })
      );
      
      // Atualizar cache também
      const currentInstance = activeInstanceId || getActiveInstance()?.id;
      const cacheKey = isAdmin ? `admin-${user?.id}` : `${currentInstance}-${user?.id}`;
      const cached = contactsCache.get(cacheKey);
      if (cached) {
        const updatedData = cached.data.map(contact => {
          if (contact.leadId === leadId || contact.id === contactId) {
            return { ...contact, name: newName };
          }
          return contact;
        });
        contactsCache.set(cacheKey, {
          data: updatedData,
          timestamp: cached.timestamp
        });
        console.log('[WhatsApp Contacts] 💾 Cache atualizado com novo nome');
      }
    };

    window.addEventListener('refreshLeadTags', handleRefreshTags);
    window.addEventListener('contactNameUpdated', handleContactNameUpdate);

    return () => {
      window.removeEventListener('refreshLeadTags', handleRefreshTags);
      window.removeEventListener('contactNameUpdated', handleContactNameUpdate);
    };
  }, [refreshContacts, activeInstanceId, getActiveInstance, isAdmin, user?.id]);

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
    addNewContact
  };
};
