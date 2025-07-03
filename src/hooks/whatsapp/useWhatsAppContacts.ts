
// FASE 5: Hook corrigido para dados reais do banco + paginação virtual
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useLeadSorting } from './chat/useLeadSorting';

// Cache global otimizado com paginação
const contactsCache = new Map<string, { data: Contact[]; timestamp: number; hasMore: boolean; }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const INITIAL_CONTACTS_LIMIT = 20; // Carregar apenas 20 contatos inicialmente
const CONTACTS_PAGE_SIZE = 15; // Carregar 15 contatos por vez ao fazer scroll

// SISTEMA DE PAGINAÇÃO VIRTUAL PARA CONTATOS
export const useWhatsAppContacts = (
  activeInstance: WhatsAppWebInstance | null,
  userId: string | null
) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMoreContacts, setIsLoadingMoreContacts] = useState(false);
  const [hasMoreContacts, setHasMoreContacts] = useState(true);
  const [highlightedContact, setHighlightedContact] = useState<string | null>(null);
  
  // Refs para controle de sincronização
  const isLoadingRef = useRef(false);
  const syncDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchParamsRef = useRef<string>('');
  const realtimeChannelRef = useRef<any>(null);
  
  // Hook de ordenação otimizada
  const { sortLeadsByRecentMessage } = useLeadSorting();

  // Memoizar parâmetros para cache
  const cacheKey = useMemo(() => {
    if (!activeInstance?.id || !userId) return '';
    return `${activeInstance.id}-${userId}-${activeInstance.connection_status}`;
  }, [activeInstance?.id, userId, activeInstance?.connection_status]);

  // Verificar cache válido
  const getCachedContacts = useCallback((key: string): { data: Contact[]; hasMore: boolean; } | null => {
    const cached = contactsCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return { data: cached.data, hasMore: cached.hasMore };
    }
    contactsCache.delete(key);
    return null;
  }, []);

  // Salvar no cache
  const setCachedContacts = useCallback((key: string, data: Contact[], hasMore: boolean) => {
    contactsCache.set(key, { data, timestamp: Date.now(), hasMore });
  }, []);

  // Função para mover contato para o topo com animação fluida
  const moveContactToTop = useCallback((contactId: string) => {
    setContacts(prevContacts => {
      const contactIndex = prevContacts.findIndex(c => c.id === contactId);
      if (contactIndex === -1 || contactIndex === 0) return prevContacts;
      
      const updatedContact = {
        ...prevContacts[contactIndex],
        lastMessageTime: new Date().toISOString(),
        unreadCount: (prevContacts[contactIndex].unreadCount || 0) + 1
      };
      
      const newContacts = [...prevContacts];
      newContacts.splice(contactIndex, 1);
      newContacts.unshift(updatedContact);
      
      return newContacts;
    });
  }, []);

  // Função para zerar contador de não lidas
  const markAsRead = useCallback(async (contactId: string) => {
    setContacts(prevContacts => 
      prevContacts.map(contact => 
        contact.id === contactId 
          ? { ...contact, unreadCount: undefined }
          : contact
      )
    );

    // Atualizar no banco se houver instância real
    if (activeInstance) {
      try {
        await supabase
          .from('leads')
          .update({ unread_count: 0 })
          .eq('id', contactId);
      } catch (error) {
        console.error('[WhatsApp Contacts] Erro ao marcar como lido:', error);
      }
    }
  }, [activeInstance]);

  // FETCH COM PAGINAÇÃO VIRTUAL: Apenas 20 contatos por vez
  const fetchContacts = useCallback(async (forceRefresh = false, loadMore = false): Promise<void> => {
    if (!cacheKey) {
      setContacts([]);
      setIsLoadingContacts(false);
      return;
    }

    // Proteções contra loops
    if (isLoadingRef.current && !forceRefresh) return;

    // Verificar cache primeiro (apenas para carregamento inicial)
    if (!forceRefresh && !loadMore) {
      const cached = getCachedContacts(cacheKey);
      if (cached) {
        setContacts(cached.data);
        setHasMoreContacts(cached.hasMore);
        setIsLoadingContacts(false);
        return;
      }
    }

    // Debouncing para múltiplas chamadas (apenas para carregamento inicial)
    if (!loadMore && syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
    }

    const executeQuery = async () => {
      try {
        isLoadingRef.current = true;
        
        if (loadMore) {
          setIsLoadingMoreContacts(true);
        } else {
          setIsLoadingContacts(true);
        }

        // Determinar parâmetros de paginação
        const limit = loadMore ? CONTACTS_PAGE_SIZE : INITIAL_CONTACTS_LIMIT;
        const offset = loadMore ? contacts.length : 0;

        // QUERY OTIMIZADA: Com paginação - sem nullsLast
        const { data: leads, error } = await supabase
          .from('leads')
          .select(`
            *,
            lead_tags(
              tag_id,
              tags(name, color)
            )
          `)
          .eq('whatsapp_number_id', activeInstance!.id)
          .eq('created_by_user_id', userId!)
          .order('last_message_time', { ascending: false, nullsFirst: false })
          .order('unread_count', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        // MAPEAMENTO OTIMIZADO
        const mappedContacts: Contact[] = (leads || []).map(lead => {
          const leadWithProfilePic = lead as any;
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
            profilePicUrl: leadWithProfilePic.profile_pic_url || '',
            isOnline: Math.random() > 0.7 // Fake status
          };
        });

        // Determinar se há mais contatos
        const hasMore = (leads?.length || 0) === limit;

        if (loadMore) {
          // Adicionar novos contatos à lista existente
          const updatedContacts = [...contacts, ...mappedContacts];
          setContacts(updatedContacts);
          setCachedContacts(cacheKey, updatedContacts, hasMore);
        } else {
          // Substituir todos os contatos
          setContacts(mappedContacts);
          setCachedContacts(cacheKey, mappedContacts, hasMore);
        }

        setHasMoreContacts(hasMore);

      } catch (error) {
        console.error('[WhatsApp Contacts] ❌ Erro na sincronização:', error);
        if (!loadMore) {
          setContacts([]);
        }
      } finally {
        isLoadingRef.current = false;
        setIsLoadingContacts(false);
        setIsLoadingMoreContacts(false);
      }
    };

    if (loadMore) {
      // Execute imediatamente para load more
      await executeQuery();
    } else {
      // Debounce apenas para carregamento inicial
      syncDebounceRef.current = setTimeout(executeQuery, 300);
    }

  }, [cacheKey, activeInstance, userId, getCachedContacts, setCachedContacts, contacts]);

  // Load more contacts
  const loadMoreContacts = useCallback(async () => {
    if (!hasMoreContacts || isLoadingMoreContacts || isLoadingContacts) return;
    await fetchContacts(false, true);
  }, [hasMoreContacts, isLoadingMoreContacts, isLoadingContacts, fetchContacts]);

  // REALTIME DESABILITADO TEMPORARIAMENTE para evitar loops
  // useEffect(() => {
  //   if (!activeInstance?.id || !userId) {
  //     return;
  //   }
  //   // ... realtime subscription
  // }, [activeInstance?.id, userId]);

  // Carregar contatos quando parâmetros mudarem
  useEffect(() => {
    if (cacheKey) {
      fetchContacts();
    } else {
      setContacts([]);
      setHasMoreContacts(true);
      setIsLoadingContacts(false);
    }

    return () => {
      if (syncDebounceRef.current) {
        clearTimeout(syncDebounceRef.current);
      }
    };
  }, [cacheKey, fetchContacts]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe();
      }
      if (syncDebounceRef.current) {
        clearTimeout(syncDebounceRef.current);
      }
    };
  }, []);

  return {
    contacts,
    isLoadingContacts,
    isLoadingMoreContacts,
    hasMoreContacts,
    fetchContacts: useCallback(() => fetchContacts(true), [fetchContacts]),
    loadMoreContacts,
    moveContactToTop,
    markAsRead,
    highlightedContact,
    setHighlightedContact
  };
};
