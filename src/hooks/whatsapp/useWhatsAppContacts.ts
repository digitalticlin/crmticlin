
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { formatPhoneDisplay } from '@/utils/phoneFormatter';
import { toast } from 'sonner';

const CONTACTS_CACHE_DURATION = 30 * 1000; // 30 segundos
const INITIAL_LOAD_LIMIT = 20;
const PAGE_SIZE = 15;

// Cache simplificado
const contactsCache = new Map<string, { data: Contact[]; timestamp: number; totalCount: number }>();

export const useWhatsAppContacts = (
  activeInstance: WhatsAppWebInstance | null,
  userId: string | null
) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMoreContacts, setIsLoadingMoreContacts] = useState(false);
  const [hasMoreContacts, setHasMoreContacts] = useState(true);
  const [totalContactsAvailable, setTotalContactsAvailable] = useState(0);

  const { permissions } = useUserPermissions();
  const isAdmin = permissions.canViewAllData;

  // Refs para controle de estado
  const lastFetchRef = useRef<number>(0);
  const isLoadingRef = useRef(false);

  // Cache key simplificado
  const cacheKey = useMemo(() => {
    if (isAdmin) return `admin-all-${userId}`;
    return `user-${userId}-${activeInstance?.id || 'no-instance'}`;
  }, [isAdmin, userId, activeInstance?.id]);

  // Função para ordenar contatos por mensagem mais recente
  const sortContactsByRecentMessage = useCallback((contactsList: Contact[]): Contact[] => {
    return [...contactsList].sort((a, b) => {
      // 1º PRIORIDADE: Mensagens não lidas (mais urgente no topo)
      const aHasUnread = a.unreadCount && a.unreadCount > 0;
      const bHasUnread = b.unreadCount && b.unreadCount > 0;
      
      if (aHasUnread && !bHasUnread) return -1;
      if (!aHasUnread && bHasUnread) return 1;
      
      // 2º PRIORIDADE: Última mensagem mais recente
      if (a.lastMessageTime && b.lastMessageTime) {
        // Converter para timestamp para comparação precisa
        const timeA = new Date(a.lastMessageTime).getTime();
        const timeB = new Date(b.lastMessageTime).getTime();
        
        if (!isNaN(timeA) && !isNaN(timeB)) {
          return timeB - timeA; // Mais recente primeiro (ordem DESC)
        }
      }
      
      // 3º PRIORIDADE: Quem tem data de mensagem sobe
      if (a.lastMessageTime && !b.lastMessageTime) return -1;
      if (!a.lastMessageTime && b.lastMessageTime) return 1;
      
      // 4º PRIORIDADE: Ordenação alfabética
      return a.name.localeCompare(b.name);
    });
  }, []);

  // Função para buscar contatos com RLS bypass correto
  const fetchContactsCore = useCallback(async (loadMore = false): Promise<void> => {
    if (!userId) {
      console.warn('[WhatsApp Contacts] ⚠️ Sem usuário autenticado');
      return;
    }

    const now = Date.now();
    
    // Throttling para evitar múltiplas chamadas
    if (now - lastFetchRef.current < 1000 && !loadMore) {
      return;
    }

    // Verificar cache apenas se não for loadMore
    if (!loadMore) {
      const cached = contactsCache.get(cacheKey);
      if (cached && now - cached.timestamp < CONTACTS_CACHE_DURATION) {
        console.log('[WhatsApp Contacts] 💾 Usando cache:', cached.data.length);
        const sortedCached = sortContactsByRecentMessage(cached.data);
        setContacts(sortedCached);
        setTotalContactsAvailable(cached.totalCount);
        setHasMoreContacts(cached.data.length < cached.totalCount);
        return;
      }
    }

    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    lastFetchRef.current = now;

    if (loadMore) {
      setIsLoadingMoreContacts(true);
    } else {
      setIsLoadingContacts(true);
    }

    try {
      const limit = loadMore ? PAGE_SIZE : INITIAL_LOAD_LIMIT;
      const offset = loadMore ? contacts.length : 0;

      console.log('[WhatsApp Contacts] 🔍 Buscando contatos:', {
        userId,
        isAdmin,
        activeInstanceId: activeInstance?.id,
        limit,
        offset,
        loadMore
      });

      // Query principal para leads (que são os contatos)
      let query = supabase
        .from('leads')
        .select(`
          id,
          name,
          phone,
          last_message,
          last_message_time,
          unread_count,
          kanban_stage_id,
          funnel_id,
          whatsapp_number_id,
          created_at,
          updated_at
        `)
        .eq('created_by_user_id', userId)
        .order('last_message_time', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      // Admin vê todos os contatos, usuário normal apenas da instância ativa
      if (!isAdmin && activeInstance?.id) {
        query = query.eq('whatsapp_number_id', activeInstance.id);
      }

      query = query.range(offset, offset + limit - 1);

      const { data: leadsData, error, count } = await query;

      if (error) {
        console.error('[WhatsApp Contacts] ❌ Erro na query:', error);
        throw error;
      }

      console.log('[WhatsApp Contacts] ✅ Dados recebidos:', {
        leadsCount: leadsData?.length || 0,
        totalCount: count
      });

      // Converter leads para formato Contact
      const contactsData: Contact[] = (leadsData || []).map(lead => ({
        id: lead.id,
        name: lead.name || formatPhoneDisplay(lead.phone),
        phone: lead.phone,
        lastMessage: lead.last_message || '',
        lastMessageTime: lead.last_message_time ? 
          new Date(lead.last_message_time).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : '',
        unreadCount: lead.unread_count || 0,
        isOnline: false, // Será implementado depois
        avatar: undefined,
        leadId: lead.id,
        stageId: lead.kanban_stage_id,
        funnelId: lead.funnel_id,
        whatsappNumberId: lead.whatsapp_number_id
      }));

      if (loadMore) {
        const updatedContacts = [...contacts, ...contactsData];
        const sortedContacts = sortContactsByRecentMessage(updatedContacts);
        setContacts(sortedContacts);
        
        // Atualizar cache
        contactsCache.set(cacheKey, {
          data: sortedContacts,
          timestamp: now,
          totalCount: count || 0
        });
      } else {
        const sortedContacts = sortContactsByRecentMessage(contactsData);
        setContacts(sortedContacts);
        
        // Atualizar cache
        contactsCache.set(cacheKey, {
          data: sortedContacts,
          timestamp: now,
          totalCount: count || 0
        });
      }

      setTotalContactsAvailable(count || 0);
      setHasMoreContacts(contactsData.length === limit);

    } catch (error: any) {
      console.error('[WhatsApp Contacts] ❌ Erro ao buscar contatos:', error);
      
      // Fallback: tentar uma query mais simples
      if (!loadMore) {
        try {
          const { data: fallbackData } = await supabase
            .from('leads')
            .select('id, name, phone, created_at')
            .eq('created_by_user_id', userId)
            .limit(10);

          if (fallbackData && fallbackData.length > 0) {
            const fallbackContacts: Contact[] = fallbackData.map(lead => ({
              id: lead.id,
              name: lead.name || formatPhoneDisplay(lead.phone),
              phone: lead.phone,
              lastMessage: 'Carregando...',
              lastMessageTime: '',
              unreadCount: 0,
              isOnline: false,
              leadId: lead.id
            }));

            setContacts(fallbackContacts);
            setTotalContactsAvailable(fallbackData.length);
            toast.info('Dados carregados em modo simplificado');
          }
        } catch (fallbackError) {
          console.error('[WhatsApp Contacts] ❌ Fallback também falhou:', fallbackError);
          toast.error('Erro ao carregar conversas');
        }
      }
    } finally {
      isLoadingRef.current = false;
      setIsLoadingContacts(false);
      setIsLoadingMoreContacts(false);
    }
  }, [userId, isAdmin, activeInstance?.id, cacheKey, contacts.length, sortContactsByRecentMessage]);

  // Função para carregar mais contatos
  const loadMoreContacts = useCallback(async (): Promise<void> => {
    if (!hasMoreContacts || isLoadingRef.current) return;
    await fetchContactsCore(true);
  }, [hasMoreContacts, fetchContactsCore]);

  // Função para refresh completo
  const fetchContacts = useCallback(async (forceRefresh = false): Promise<void> => {
    if (forceRefresh) {
      contactsCache.delete(cacheKey);
    }
    await fetchContactsCore(false);
  }, [fetchContactsCore, cacheKey]);

  // Função para mover contato para o topo
  const moveContactToTop = useCallback((contactId: string, newMessage?: string) => {
    setContacts(prevContacts => {
      const contactIndex = prevContacts.findIndex(c => c.id === contactId);
      if (contactIndex === -1) return prevContacts;

      const updatedContacts = [...prevContacts];
      const contact = { ...updatedContacts[contactIndex] };
      
      // Atualizar dados do contato
      if (newMessage) {
        contact.lastMessage = newMessage;
        contact.lastMessageTime = new Date().toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        contact.unreadCount = (contact.unreadCount || 0) + 1;
      }

      // Aplicar ordenação automática
      updatedContacts[contactIndex] = contact;
      const sortedContacts = sortContactsByRecentMessage(updatedContacts);

      // Atualizar cache
      contactsCache.set(cacheKey, {
        data: sortedContacts,
        timestamp: Date.now(),
        totalCount: totalContactsAvailable
      });

      return sortedContacts;
    });
  }, [cacheKey, totalContactsAvailable, sortContactsByRecentMessage]);

  // Função para marcar como lido
  const markAsRead = useCallback(async (contactId: string) => {
    try {
      await supabase
        .from('leads')
        .update({ unread_count: 0 })
        .eq('id', contactId)
        .eq('created_by_user_id', userId);

      // Atualizar estado local
      setContacts(prevContacts => {
        const updatedContacts = prevContacts.map(contact => 
          contact.id === contactId 
            ? { ...contact, unreadCount: 0 }
            : contact
        );
        
        // Reordenar após marcar como lida
        return sortContactsByRecentMessage(updatedContacts);
      });

      console.log('[WhatsApp Contacts] ✅ Marcado como lido:', contactId);
    } catch (error) {
      console.error('[WhatsApp Contacts] ❌ Erro ao marcar como lido:', error);
    }
  }, [userId, sortContactsByRecentMessage]);

  // Carregar contatos quando deps mudarem
  useEffect(() => {
    if (userId) {
      console.log('[WhatsApp Contacts] 🔄 Carregando contatos para:', userId);
      fetchContactsCore(false);
    } else {
      setContacts([]);
      setTotalContactsAvailable(0);
    }
  }, [userId, activeInstance?.id, fetchContactsCore]);

  return {
    contacts,
    isLoadingContacts,
    isLoadingMoreContacts,
    hasMoreContacts,
    fetchContacts,
    loadMoreContacts,
    moveContactToTop,
    markAsRead,
    totalContactsAvailable
  };
};
