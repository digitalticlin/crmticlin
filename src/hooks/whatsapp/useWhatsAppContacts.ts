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
  searchContacts: (query: string) => Promise<void>;
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
  const isSearchModeRef = useRef(false);
  const searchQueryRef = useRef("");

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

      // Query isolada para contatos - incluindo foto de perfil e filtro de conversas ativas
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
          profile_pic_url,
          conversation_status
        `, { count: 'exact' })
        .eq('created_by_user_id', user.id)
        .in('conversation_status', ['active', 'closed'])  // ✅ Filtrar apenas conversas ativas e fechadas (não arquivadas)
        .order('last_message_time', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      // Filtrar por instância se fornecida
      if (activeInstanceId) {
        query = query.eq('whatsapp_number_id', activeInstanceId);
      }

      // Aplicar busca no servidor quando em modo de busca
      if (isSearchModeRef.current && searchQueryRef.current.trim()) {
        const q = searchQueryRef.current.trim();
        const ilike = `%${q}%`;
        query = query.or(
          `name.ilike.${ilike},phone.ilike.${ilike},email.ilike.${ilike},notes.ilike.${ilike}`
        );
      }

      // 🚀 CORREÇÃO CRÍTICA: Em modo de busca, não aplicar paginação para encontrar todos os resultados
      let leadsData, error, count;
      if (isSearchModeRef.current && searchQueryRef.current.trim()) {
        // Busca SEM paginação - retorna todos os resultados que fazem match
        console.log('[WhatsApp Contacts] 🔍 Busca sem paginação - pesquisando em todos os leads');
        const result = await query;
        leadsData = result.data;
        error = result.error;
        count = result.data?.length || 0;
      } else {
        // Paginação normal quando não está pesquisando
        console.log('[WhatsApp Contacts] 📄 Carregamento paginado normal');
        const result = await query.range(offset, offset + CONTACTS_LIMIT - 1);
        leadsData = result.data;
        error = result.error;
        count = result.count;
      }

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
        assignedUser: lead.owner?.full_name || lead.owner_id,
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
        // Para primeira página (seja busca ou carregamento normal), substitui todos os contatos
        console.log('[WhatsApp Contacts] 🔄 Substituindo todos os contatos (primeira página)');
        setContacts(fetchedContacts);
        
        // Atualizar cache isolado
        cache.current.set(cacheKey, {
          data: fetchedContacts,
          timestamp: Date.now(),
          hasMore: !isSearchModeRef.current && fetchedContacts.length === CONTACTS_LIMIT,
          total: count || 0
        });
      } else {
        // Para páginas subsequentes (apenas quando não pesquisando)
        console.log('[WhatsApp Contacts] ➕ Adicionando contatos à lista existente (paginação)');
        setContacts(prev => [...prev, ...fetchedContacts]);
      }

      // 🚀 Em modo de busca, não há mais páginas (todos os resultados carregados)
      const hasMoreResults = isSearchModeRef.current ? false : fetchedContacts.length === CONTACTS_LIMIT;
      setHasMoreContacts(hasMoreResults);
      setTotalContactsAvailable(count || 0);
      
      // Atualizar offset apenas se não estiver pesquisando
      if (!isSearchModeRef.current) {
        currentOffsetRef.current = offset + fetchedContacts.length;
      } else {
        currentOffsetRef.current = 0; // Reset offset para busca
      }

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
    // 🚀 Não carregar mais páginas se estiver em modo de busca (todos os resultados já carregados)
    if (hasMoreContacts && !isLoadingRef.current && !isSearchModeRef.current) {
      console.log('[WhatsApp Contacts] 📄 Carregando próxima página...');
      await fetchContacts(currentOffsetRef.current);
    } else if (isSearchModeRef.current) {
      console.log('[WhatsApp Contacts] 🔍 Em modo de busca - todos os resultados já carregados');
    }
  }, [hasMoreContacts, fetchContacts]);

  // Refresh contatos
  const refreshContacts = useCallback(() => {
    // Invalidar cache
    cache.current.delete(cacheKey);
    currentOffsetRef.current = 0;
    // Não alterar o modo de busca aqui; apenas recarregar conforme o estado atual
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
    console.log('[WhatsApp Contacts] ➕ addNewContact chamado:', newContactData);
    
    if (!newContactData.id && !newContactData.leadId) {
      console.error('[WhatsApp Contacts] ❌ Novo contato sem ID válido:', newContactData);
      return;
    }

    const newContact: Contact = {
      id: newContactData.id || newContactData.leadId || '',
      name: newContactData.name || 'Novo Contato',
      phone: newContactData.phone || '',
      email: newContactData.email,
      address: newContactData.address,
      company: newContactData.company,
      documentId: newContactData.documentId,
      notes: newContactData.notes,
      purchaseValue: newContactData.purchaseValue,
      assignedUser: newContactData.assignedUser,
      lastMessage: newContactData.lastMessage,
      lastMessageTime: newContactData.lastMessageTime || new Date().toISOString(),
      unreadCount: newContactData.unreadCount, // Não forçar 1 se não tiver
      leadId: newContactData.leadId || newContactData.id,
      whatsapp_number_id: newContactData.whatsapp_number_id,
      stageId: newContactData.stageId || null,
      createdAt: newContactData.createdAt || new Date().toISOString(),
      tags: newContactData.tags || [],
      instanceInfo: newContactData.instanceInfo,
      avatar: newContactData.avatar,
      profilePicUrl: newContactData.profilePicUrl
    };
    
    console.log('[WhatsApp Contacts] 📋 Contato formatado para adicionar:', {
      id: newContact.id,
      name: newContact.name,
      phone: newContact.phone,
      leadId: newContact.leadId
    });

    setContacts(prevContacts => {
      console.log('[WhatsApp Contacts] 🔍 Verificando se contato já existe...');
      console.log('[WhatsApp Contacts] 📊 Contatos atuais:', prevContacts.length);
      
      // Verificar se contato já existe
      const existingIndex = prevContacts.findIndex(c => 
        c.id === newContact.id || c.leadId === newContact.leadId
      );
      
      if (existingIndex !== -1) {
        console.log('[WhatsApp Contacts] ⚠️ Contato já existe no índice:', existingIndex);
        console.log('[WhatsApp Contacts] 📋 Contato existente:', {
          id: prevContacts[existingIndex].id,
          name: prevContacts[existingIndex].name,
          leadId: prevContacts[existingIndex].leadId
        });
        moveContactToTop(newContact.id, {
          text: newContact.lastMessage || '',
          timestamp: newContact.lastMessageTime,
          unreadCount: newContact.unreadCount
        });
        return prevContacts;
      }
      
      console.log('[WhatsApp Contacts] ➕ Adicionando novo contato ao topo:', newContact.name);
      const newContacts = [newContact, ...prevContacts];
      console.log('[WhatsApp Contacts] 📊 Total após adição:', newContacts.length);
      return newContacts;
    });
  }, [moveContactToTop]);

  // Buscar contato por ID
  const getContactById = useCallback((contactId: string): Contact | null => {
    return contacts.find(c => c.id === contactId || c.leadId === contactId) || null;
  }, [contacts]);

  // Buscar contatos por query
  const searchContacts = useCallback(async (query: string) => {
    const hasQuery = !!query.trim();
    
    console.log('[WhatsApp Contacts] 🔍 searchContacts chamado:', {
      query,
      hasQuery,
      previousMode: isSearchModeRef.current,
      newMode: hasQuery
    });
    
    // Detectar se estamos limpando o filtro (saindo do modo de busca)
    const wasSearching = isSearchModeRef.current;
    const isNowSearching = hasQuery;
    
    // Atualizar refs de busca
    isSearchModeRef.current = isNowSearching;
    searchQueryRef.current = query || "";
    
    // Se estávamos pesquisando e agora não estamos mais, limpar cache para carregar dados originais
    if (wasSearching && !isNowSearching) {
      console.log('[WhatsApp Contacts] 🔄 Saindo do modo de busca - limpando cache e resetando paginação');
      cache.current.delete(cacheKey);
      currentOffsetRef.current = 0;
    } else if (!wasSearching && isNowSearching) {
      console.log('[WhatsApp Contacts] 🔍 Entrando no modo de busca - invalidando cache');
      cache.current.delete(cacheKey);
      currentOffsetRef.current = 0;
    } else if (wasSearching && isNowSearching) {
      console.log('[WhatsApp Contacts] 🔄 Alterando termo de busca');
      cache.current.delete(cacheKey);
      currentOffsetRef.current = 0;
    }
    
    // Sempre recarregar do servidor quando há mudança na busca
    await fetchContacts(0, true);
  }, [fetchContacts, cacheKey]);

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