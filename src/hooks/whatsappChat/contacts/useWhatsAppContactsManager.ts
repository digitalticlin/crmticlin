/**
 * 🎯 WHATSAPP CHAT CONTACTS MANAGER
 *
 * Hook especializado para gerenciamento de contatos
 * Isolado e otimizado com React Query
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { whatsappChatContactsQueryKeys, whatsappChatInvalidation } from '../queryKeys';
import { useWhatsAppChatCoordinator } from '../core/useWhatsAppChatCoordinator';
import { Contact } from '@/types/chat';
import { useContactsRealtime } from '@/hooks/whatsapp/realtime/useContactsRealtime';

interface UseWhatsAppContactsManagerParams {
  activeInstanceId?: string | null;
  enableSearch?: boolean;
  enableInfiniteScroll?: boolean;
}

interface UseWhatsAppContactsManagerReturn {
  // Dados básicos
  contacts: Contact[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  totalAvailable: number;

  // Ações
  loadMore: () => Promise<void>;
  refresh: () => void;
  search: (query: string) => Promise<void>;
  addSpecificContact: (contact: Contact) => void;

  // Filtros
  setFilterType: (type: 'all' | 'unread') => void;
  filterType: 'all' | 'unread';
  searchQuery: string;

  // Estados
  isSearching: boolean;
  searchResults: Contact[];

  // Stats de realtime (WebSocket)
  realtimeConnected: boolean;
  realtimeTotalEvents: number;
}

const CONTACTS_PER_PAGE = 20;

export const useWhatsAppContactsManager = ({
  activeInstanceId,
  enableSearch = true,
  enableInfiniteScroll = true
}: UseWhatsAppContactsManagerParams = {}): UseWhatsAppContactsManagerReturn => {

  console.log('[WhatsApp Contacts Manager] 🎯 Hook inicializado', {
    hasInstance: !!activeInstanceId,
    enableSearch,
    enableInfiniteScroll
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const coordinator = useWhatsAppChatCoordinator();

  // WebSocket Real-time para contatos (substitui polling)
  const realtimeContacts = useContactsRealtime({
    activeInstanceId,
    onContactUpdate: useCallback(() => {
      console.log('[WhatsApp Contacts Manager] 🔥 Contato atualizado via WebSocket');

      // Invalidar queries para refetch
      queryClient.invalidateQueries({
        queryKey: whatsappChatContactsQueryKeys.base
      });
    }, [queryClient]),
    onMoveContactToTop: useCallback((contactId: string) => {
      console.log('[WhatsApp Contacts Manager] ⬆️ Movendo contato ao topo:', contactId);

      // Invalidar para reordenar lista
      queryClient.invalidateQueries({
        queryKey: whatsappChatContactsQueryKeys.base
      });
    }, [queryClient]),
    onUpdateUnreadCount: useCallback((contactId: string, increment?: boolean) => {
      console.log('[WhatsApp Contacts Manager] 📧 Contador de não lidas atualizado:', contactId, increment);

      // Invalidar para atualizar contador
      queryClient.invalidateQueries({
        queryKey: whatsappChatContactsQueryKeys.base
      });
    }, [queryClient]),
    enabled: !!activeInstanceId && !!user?.id
  });

  // Estados locais
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [specificContacts, setSpecificContacts] = useState<Contact[]>([]);

  // Query para lista normal de contatos
  const {
    data: contactsData,
    isLoading: isLoadingContacts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchContacts
  } = useInfiniteQuery({
    queryKey: whatsappChatContactsQueryKeys.infinite(
      activeInstanceId || '',
      user?.id || '',
      { filterType }
    ),
    queryFn: async ({ pageParam = 0 }) => {
      if (!activeInstanceId || !user?.id) {
        return { data: [], count: 0, hasMore: false };
      }

      console.log('[WhatsApp Contacts Manager] 📞 Carregando contatos:', {
        instanceId: activeInstanceId,
        page: pageParam,
        filterType
      });

      // FILTRO MULTITENANT: Buscar role do usuário primeiro
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, created_by_user_id')
        .eq('id', user?.id)
        .single();

      if (!profile) {
        throw new Error('Profile não encontrado');
      }

      console.log('[WhatsApp Contacts Manager] 👤 Role do usuário:', profile.role);

      // Query base na tabela LEADS (correta)
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
        console.log('[WhatsApp Contacts Manager] 🔑 Aplicando filtro ADMIN');
        query = query.eq('created_by_user_id', user?.id);
      } else {
        // Operacional: vê TODOS os leads das instâncias que tem acesso
        console.log('[WhatsApp Contacts Manager] 🔒 Aplicando filtro OPERACIONAL - buscando instâncias acessíveis');

        // Buscar instâncias que o usuário operacional pode acessar
        const { data: userWhatsAppNumbers } = await supabase
          .from('user_whatsapp_numbers')
          .select('whatsapp_number_id')
          .eq('profile_id', user?.id);

        if (!userWhatsAppNumbers || userWhatsAppNumbers.length === 0) {
          console.log('[WhatsApp Contacts Manager] ⚠️ Usuário operacional sem instâncias atribuídas');
          // Retornar query impossível para não mostrar nada
          query = query.eq('id', 'impossible-id');
        } else {
          const whatsappIds = userWhatsAppNumbers.map(uwn => uwn.whatsapp_number_id);
          console.log('[WhatsApp Contacts Manager] 🎯 Instâncias acessíveis:', whatsappIds);

          // Filtrar leads por instâncias acessíveis
          query = query.in('whatsapp_number_id', whatsappIds);
        }
      }

      // Filtrar por instância específica se fornecida (refinamento)
      if (activeInstanceId) {
        console.log('[WhatsApp Contacts Manager] 📱 Filtro por instância específica aplicado:', activeInstanceId);
        query = query.eq('whatsapp_number_id', activeInstanceId);
      }

      // Aplicar filtros
      if (filterType === 'unread') {
        query = query.gt('unread_count', 0);
      }

      // Paginação
      const from = pageParam * CONTACTS_PER_PAGE;
      const to = from + CONTACTS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('[WhatsApp Contacts Manager] ❌ Erro ao carregar contatos:', error);
        throw error;
      }

      const contacts: Contact[] = (data || []).map(lead => ({
        id: lead.id,
        name: lead.name || null,
        phone: lead.phone || '',
        email: lead.email,
        address: lead.address,
        company: lead.company,
        documentId: lead.document_id,
        notes: lead.notes,
        purchaseValue: lead.purchase_value,
        assignedUser: lead.owner_id || 'Não atribuído',
        lastMessage: lead.last_message,
        lastMessageTime: lead.last_message_time,
        unreadCount: lead.unread_count && lead.unread_count > 0 ? lead.unread_count : undefined,
        leadId: lead.id,
        whatsapp_number_id: lead.whatsapp_number_id || undefined,
        stageId: lead.kanban_stage_id || null,
        createdAt: lead.created_at,
        tags: [], // Será preenchido separadamente se necessário
        instanceInfo: undefined,
        avatar: lead.profile_pic_url || undefined,
        profilePicture: lead.profile_pic_url || null,
        profilePicUrl: lead.profile_pic_url || undefined
      }));

      const hasMore = data ? data.length === CONTACTS_PER_PAGE : false;

      return {
        data: contacts,
        count: count || 0,
        hasMore,
        nextPage: hasMore ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!activeInstanceId && !!user?.id,
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  // Query para busca de contatos
  const {
    data: searchData,
    isLoading: isLoadingSearch,
    refetch: refetchSearch
  } = useQuery({
    queryKey: whatsappChatContactsQueryKeys.search(
      activeInstanceId || '',
      user?.id || '',
      searchQuery,
      filterType
    ),
    queryFn: async () => {
      if (!activeInstanceId || !user?.id || !searchQuery.trim()) {
        return [];
      }

      console.log('[WhatsApp Contacts Manager] 🔍 Buscando contatos:', {
        query: searchQuery,
        filterType,
        instanceId: activeInstanceId
      });

      // FILTRO MULTITENANT: Buscar role do usuário primeiro (para busca)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, created_by_user_id')
        .eq('id', user?.id)
        .single();

      if (!profile) {
        throw new Error('Profile não encontrado');
      }

      // Query base na tabela LEADS (correta) - para busca
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
        `)
        .in('conversation_status', ['active', 'closed']);

      // Aplicar filtro multitenant baseado na role (busca)
      if (profile.role === 'admin') {
        query = query.eq('created_by_user_id', user?.id);
      } else {
        // Operacional: buscar instâncias que pode acessar
        const { data: userWhatsAppNumbers } = await supabase
          .from('user_whatsapp_numbers')
          .select('whatsapp_number_id')
          .eq('profile_id', user?.id);

        if (!userWhatsAppNumbers || userWhatsAppNumbers.length === 0) {
          query = query.eq('id', 'impossible-id');
        } else {
          const whatsappIds = userWhatsAppNumbers.map(uwn => uwn.whatsapp_number_id);
          query = query.in('whatsapp_number_id', whatsappIds);
        }
      }

      // Filtrar por instância específica se fornecida
      if (activeInstanceId) {
        query = query.eq('whatsapp_number_id', activeInstanceId);
      }

      // Busca por nome ou telefone
      query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);

      // Aplicar filtros
      if (filterType === 'unread') {
        query = query.gt('unread_count', 0);
      }

      query = query.order('last_message_time', { ascending: false }).limit(50);

      const { data, error } = await query;

      if (error) {
        console.error('[WhatsApp Contacts Manager] ❌ Erro na busca:', error);
        throw error;
      }

      return (data || []).map(lead => ({
        id: lead.id,
        name: lead.name || null,
        phone: lead.phone || '',
        email: lead.email,
        address: lead.address,
        company: lead.company,
        documentId: lead.document_id,
        notes: lead.notes,
        purchaseValue: lead.purchase_value,
        assignedUser: lead.owner_id || 'Não atribuído',
        lastMessage: lead.last_message,
        lastMessageTime: lead.last_message_time,
        unreadCount: lead.unread_count && lead.unread_count > 0 ? lead.unread_count : undefined,
        leadId: lead.id,
        whatsapp_number_id: lead.whatsapp_number_id || undefined,
        stageId: lead.kanban_stage_id || null,
        createdAt: lead.created_at,
        tags: [], // Será preenchido separadamente se necessário
        instanceInfo: undefined,
        avatar: lead.profile_pic_url || undefined,
        profilePicture: lead.profile_pic_url || null,
        profilePicUrl: lead.profile_pic_url || undefined
      }));
    },
    enabled: !!activeInstanceId && !!user?.id && !!searchQuery.trim(),
    staleTime: 30000
  });

  // Contatos finais (busca ou lista normal + específicos)
  const contacts = useMemo(() => {
    let baseContacts: Contact[] = [];

    if (searchQuery.trim()) {
      baseContacts = searchData || [];
    } else if (contactsData?.pages) {
      baseContacts = contactsData.pages.flatMap(page => page.data);
    }

    // Adicionar contatos específicos (de leads da URL) no topo, evitando duplicatas
    const specificContactsFiltered = specificContacts.filter(
      specific => !baseContacts.some(base => base.id === specific.id)
    );

    return [...specificContactsFiltered, ...baseContacts];
  }, [searchQuery, searchData, contactsData, specificContacts]);

  // Estatísticas
  const totalAvailable = contactsData?.pages?.[0]?.count || 0;
  const hasMore = hasNextPage && !searchQuery.trim();
  const isLoading = isLoadingContacts && contacts.length === 0;
  const isLoadingMore = isFetchingNextPage;

  // Ações
  const loadMore = useCallback(async () => {
    if (!enableInfiniteScroll || !hasMore || isLoadingMore) return;

    console.log('[WhatsApp Contacts Manager] 📄 Carregando mais contatos');
    await fetchNextPage();
  }, [enableInfiniteScroll, hasMore, isLoadingMore, fetchNextPage]);

  const refresh = useCallback(() => {
    console.log('[WhatsApp Contacts Manager] 🔄 Refresh solicitado');

    coordinator.emit({
      type: 'contact:update',
      payload: { action: 'refresh' },
      priority: 'high',
      source: 'ContactsManager'
    });

    if (searchQuery.trim()) {
      refetchSearch();
    } else {
      refetchContacts();
    }
  }, [coordinator, searchQuery, refetchSearch, refetchContacts]);

  const search = useCallback(async (query: string) => {
    console.log('[WhatsApp Contacts Manager] 🔍 Busca iniciada:', query);

    setIsSearching(true);
    setSearchQuery(query);

    coordinator.emit({
      type: 'filter:change',
      payload: { searchQuery: query, filterType },
      priority: 'normal',
      source: 'ContactsManager'
    });

    setTimeout(() => setIsSearching(false), 300);
  }, [coordinator, filterType]);

  // Função para adicionar contato específico (ex: da URL do funil)
  const addSpecificContact = useCallback((contact: Contact) => {
    console.log('[WhatsApp Contacts Manager] ➕ Adicionando contato específico:', contact.name);

    setSpecificContacts(prev => {
      // Evitar duplicatas
      const exists = prev.some(c => c.id === contact.id);
      if (exists) return prev;

      // Adicionar no topo
      return [contact, ...prev];
    });
  }, []);

  // Invalidar cache quando instância muda
  useEffect(() => {
    if (activeInstanceId) {
      queryClient.invalidateQueries({
        queryKey: whatsappChatContactsQueryKeys.base
      });
    }
  }, [activeInstanceId, queryClient]);

  return {
    // Dados
    contacts,
    isLoading,
    isLoadingMore,
    hasMore,
    totalAvailable,

    // Ações
    loadMore,
    refresh,
    search,
    addSpecificContact,

    // Filtros
    setFilterType,
    filterType,
    searchQuery,

    // Estados
    isSearching: isSearching || isLoadingSearch,
    searchResults: searchData || [],

    // Stats de realtime
    realtimeConnected: realtimeContacts.isConnected,
    realtimeTotalEvents: realtimeContacts.totalEvents
  };
};