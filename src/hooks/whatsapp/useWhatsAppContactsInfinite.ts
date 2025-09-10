/**
 * 🚀 HOOK WHATSAPP CONTATOS - SCROLL INFINITO COM REACT QUERY
 * 
 * RESPONSABILIDADES:
 * ✅ Gerenciar lista de contatos com scroll infinito
 * ✅ Query keys isoladas (chat-contacts)  
 * ✅ Paginação de 30 contatos por página
 * ✅ Cache automático do React Query
 * ✅ Invalidação automática
 * 
 * VERSION: 3.0 - SCROLL INFINITO IMPLEMENTADO
 */

import { useCallback, useRef, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { chatContactsQueryKeys } from '@/hooks/chat/queryKeys';

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

const CONTACTS_PER_PAGE = 30; // SCROLL INFINITO: 30 contatos por página

// Função para converter dados do banco para Contact
const convertToContact = (leadData: any): Contact => {
  return {
    id: leadData.id,
    name: leadData.name || null,
    phone: leadData.phone || '',
    email: leadData.email,
    address: leadData.address,
    company: leadData.company,
    documentId: leadData.document_id,
    notes: leadData.notes,
    purchaseValue: leadData.purchase_value,
    assignedUser: leadData.owner_id || 'Não atribuído',
    lastMessage: leadData.last_message,
    lastMessageTime: leadData.last_message_time,
    unreadCount: leadData.unread_count && leadData.unread_count > 0 ? leadData.unread_count : undefined,
    leadId: leadData.id,
    whatsapp_number_id: leadData.whatsapp_number_id || undefined,
    stageId: leadData.kanban_stage_id || null,
    createdAt: leadData.created_at,
    tags: [], // Será preenchido separadamente
    instanceInfo: undefined,
    avatar: leadData.profile_pic_url || undefined,
    profilePicUrl: leadData.profile_pic_url || undefined
  };
};

// Função para buscar contatos com paginação (SCROLL INFINITO)
const fetchContacts = async (
  userId: string,
  activeInstanceId?: string | null,
  pageParam = 0
) => {
  console.log('[WhatsApp Contacts INFINITE] 🚀🚀🚀 SCROLL INFINITO - Buscando contatos com paginação:', {
    userId,
    activeInstanceId,
    pageParam,
    version: 'V3.0_INFINITE_SCROLL',
    timestamp: new Date().toISOString()
  });
  
  // CACHE BUSTER: Log único para verificar se nova versão está ativa
  console.warn('🔥 SCROLL INFINITO ATIVO - VERSÃO 3.0 DO HOOK CONTATOS CARREGADA! 🔥');

  // FILTRO MULTITENANT: Buscar role do usuário primeiro
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, created_by_user_id')
    .eq('id', userId)
    .single();

  if (!profile) {
    throw new Error('Profile não encontrado');
  }

  console.log('[WhatsApp Contacts INFINITE] 👤 Role do usuário:', profile.role);

  // Query base
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
    .in('conversation_status', ['active', 'closed'])
    .order('last_message_time', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  // Aplicar filtro multitenant baseado na role
  if (profile.role === 'admin') {
    // Admin: vê leads que criou
    console.log('[WhatsApp Contacts INFINITE] 🔑 Filtro ADMIN aplicado');
    query = query.eq('created_by_user_id', userId);
  } else {
    // Operacional: vê TODOS os leads das instâncias que tem acesso
    console.log('[WhatsApp Contacts INFINITE] 🔒 Filtro OPERACIONAL aplicado - buscando instâncias acessíveis');
    
    // Buscar instâncias que o usuário operacional pode acessar
    const { data: userWhatsAppNumbers } = await supabase
      .from('user_whatsapp_numbers')
      .select('whatsapp_number_id')
      .eq('profile_id', userId);

    if (!userWhatsAppNumbers || userWhatsAppNumbers.length === 0) {
      console.log('[WhatsApp Contacts INFINITE] ⚠️ Usuário operacional sem instâncias atribuídas');
      // Retornar query impossível para não mostrar nada
      query = query.eq('id', 'impossible-id');
    } else {
      const whatsappIds = userWhatsAppNumbers.map(uwn => uwn.whatsapp_number_id);
      console.log('[WhatsApp Contacts INFINITE] 🎯 Instâncias acessíveis:', whatsappIds);
      
      // Filtrar leads por instâncias acessíveis
      query = query.in('whatsapp_number_id', whatsappIds);
    }
  }

  // Filtrar por instância específica se fornecida (refinamento)
  if (activeInstanceId) {
    console.log('[WhatsApp Contacts INFINITE] 📱 Filtro por instância específica aplicado:', activeInstanceId);
    query = query.eq('whatsapp_number_id', activeInstanceId);
  }

  // Calcular range para paginação
  const from = pageParam * CONTACTS_PER_PAGE;
  const to = from + CONTACTS_PER_PAGE - 1;
  
  const { data: leadsData, error, count } = await query
    .range(from, to);

  if (error) throw error;

  console.log('[WhatsApp Contacts INFINITE] ✅ Dados recebidos (SCROLL INFINITO):', {
    totalContacts: count,
    loadedContacts: leadsData?.length || 0,
    pageParam,
    from,
    to,
    hasMore: (leadsData?.length || 0) === CONTACTS_PER_PAGE
  });

  // Converter para formato Contact
  const contacts = (leadsData || []).map(convertToContact);

  // Buscar tags para os leads
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
      .eq('tags.created_by_user_id', userId);

    // Mapear tags aos contatos
    const tagsMap: Record<string, any[]> = {};
    (tagsData || []).forEach(item => {
      if (!tagsMap[item.lead_id]) {
        tagsMap[item.lead_id] = [];
      }
      tagsMap[item.lead_id].push(item.tags);
    });

    // Adicionar tags aos contatos
    contacts.forEach(contact => {
      contact.tags = tagsMap[contact.id] || [];
    });
  }

  return {
    contacts,
    total: count || 0,
    hasMore: (leadsData?.length || 0) === CONTACTS_PER_PAGE,
    nextPage: (leadsData?.length || 0) === CONTACTS_PER_PAGE ? pageParam + 1 : undefined,
    currentPage: pageParam
  };
};

export const useWhatsAppContacts = ({ 
  activeInstanceId 
}: UseWhatsAppContactsParams = {}): UseWhatsAppContactsReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query infinita para contatos (SCROLL INFINITO + ANTI-LOOP)
  const {
    data: queryData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: chatContactsQueryKeys.list(user?.id || ''),
    queryFn: ({ pageParam = 0 }) => {
      if (!user?.id) throw new Error('User ID required');
      return fetchContacts(user.id, activeInstanceId, pageParam);
    },
    enabled: !!user?.id,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 3 * 60 * 1000, // 3 minutos - AUMENTADO para evitar loops
    gcTime: 15 * 60 * 1000, // 15 minutos - AUMENTADO para cache estável
    refetchOnWindowFocus: false, // DESABILITADO - evita refetch desnecessário
    refetchOnMount: true, // Apenas na primeira montagem
    refetchInterval: false, // DESABILITADO - sem polling automático
    retry: 1, // Máximo 1 retry para evitar loops
  });

  console.log('[WhatsApp Contacts INFINITE] 📊 Hook state:', {
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    hasData: !!queryData,
    pagesCount: queryData?.pages?.length || 0,
    totalContactsLoaded: queryData?.pages?.reduce((acc, page) => acc + page.contacts.length, 0) || 0
  });

  // Dados extraídos de todas as páginas
  const contacts = useMemo(() => {
    return queryData?.pages?.reduce((acc, page) => {
      return [...acc, ...page.contacts];
    }, [] as Contact[]) || [];
  }, [queryData?.pages]);

  const totalContactsAvailable = queryData?.pages?.[0]?.total || 0;
  const hasMoreContacts = hasNextPage;

  // Função para carregar mais contatos (SCROLL INFINITO)
  const loadMoreContacts = useCallback(async () => {
    if (!isFetchingNextPage && hasNextPage) {
      console.log('[WhatsApp Contacts INFINITE] 📖 Carregando mais contatos via scroll infinito');
      await fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Função para refresh
  const refreshContacts = useCallback(() => {
    console.log('[WhatsApp Contacts INFINITE] 🔄 Refresh via React Query invalidation');
    queryClient.invalidateQueries({
      queryKey: chatContactsQueryKeys.base
    });
  }, [queryClient]);

  // Função para mover contato para o topo
  const moveContactToTop = useCallback((contactId: string, newMessage?: any) => {
    queryClient.setQueryData(
      chatContactsQueryKeys.list(user?.id || ''),
      (oldData: any) => {
        if (!oldData?.pages) return oldData;

        const newPages = [...oldData.pages];
        let movedContact: Contact | null = null;

        // Encontrar e remover o contato de qualquer página
        for (let pageIndex = 0; pageIndex < newPages.length; pageIndex++) {
          const page = newPages[pageIndex];
          const contactIndex = page.contacts.findIndex((c: Contact) => c.id === contactId);
          
          if (contactIndex !== -1) {
            movedContact = page.contacts.splice(contactIndex, 1)[0];
            
            // Atualizar dados do contato se houver nova mensagem
            if (newMessage) {
              movedContact.lastMessage = newMessage.text || movedContact.lastMessage;
              movedContact.lastMessageTime = newMessage.timestamp || movedContact.lastMessageTime;
            }
            break;
          }
        }

        // Se encontrou o contato, adicionar no topo da primeira página
        if (movedContact && newPages[0]) {
          newPages[0].contacts.unshift(movedContact);
        }

        return { ...oldData, pages: newPages };
      }
    );
  }, [queryClient, user?.id]);

  // Função para atualizar contador de não lidas
  const updateUnreadCount = useCallback((contactId: string, increment = true) => {
    queryClient.setQueryData(
      chatContactsQueryKeys.list(user?.id || ''),
      (oldData: any) => {
        if (!oldData?.pages) return oldData;

        const newPages = oldData.pages.map((page: any) => ({
          ...page,
          contacts: page.contacts.map((contact: Contact) => {
            if (contact.id === contactId) {
              const currentCount = contact.unreadCount || 0;
              const newCount = increment ? currentCount + 1 : 0;
              return {
                ...contact,
                unreadCount: newCount > 0 ? newCount : undefined
              };
            }
            return contact;
          })
        }));

        return { ...oldData, pages: newPages };
      }
    );
  }, [queryClient, user?.id]);

  // Função para adicionar novo contato
  const addNewContact = useCallback((newContactData: Partial<Contact>) => {
    queryClient.setQueryData(
      chatContactsQueryKeys.list(user?.id || ''),
      (oldData: any) => {
        if (!oldData?.pages || oldData.pages.length === 0) return oldData;

        const newContact: Contact = {
          id: newContactData.id || '',
          name: newContactData.name || null,
          phone: newContactData.phone || '',
          email: newContactData.email,
          address: newContactData.address,
          company: newContactData.company,
          documentId: newContactData.documentId,
          notes: newContactData.notes,
          purchaseValue: newContactData.purchaseValue,
          assignedUser: newContactData.assignedUser || 'Não atribuído',
          lastMessage: newContactData.lastMessage,
          lastMessageTime: newContactData.lastMessageTime,
          unreadCount: newContactData.unreadCount,
          leadId: newContactData.leadId || newContactData.id,
          whatsapp_number_id: newContactData.whatsapp_number_id,
          stageId: newContactData.stageId || null,
          createdAt: newContactData.createdAt || new Date().toISOString(),
          tags: newContactData.tags || [],
          instanceInfo: newContactData.instanceInfo,
          avatar: newContactData.avatar,
          profilePicUrl: newContactData.profilePicUrl
        };

        const newPages = [...oldData.pages];
        newPages[0] = {
          ...newPages[0],
          contacts: [newContact, ...newPages[0].contacts],
          total: newPages[0].total + 1
        };

        return { ...oldData, pages: newPages };
      }
    );
  }, [queryClient, user?.id]);

  // Função para buscar contato por ID
  const getContactById = useCallback((contactId: string): Contact | null => {
    return contacts.find(contact => contact.id === contactId) || null;
  }, [contacts]);

  // Função para busca (placeholder)
  const searchContacts = useCallback(async (query: string) => {
    console.log('[WhatsApp Contacts INFINITE] 🔍 Busca:', query);
    // TODO: Implementar busca se necessário
  }, []);

  return {
    contacts,
    isLoading,
    isLoadingMore: isFetchingNextPage,
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