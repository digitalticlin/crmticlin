/**
 * 🔍 HOOK EXCLUSIVO WHATSAPP - BUSCA DE CONTATOS COM FILTROS
 *
 * ISOLADO E INDEPENDENTE - NÃO COMPARTILHA NADA COM OUTROS HOOKS
 *
 * RESPONSABILIDADES:
 * ✅ Buscar contatos WhatsApp com filtros no servidor
 * ✅ Suportar busca por texto em múltiplos campos
 * ✅ Filtrar por status (todas/não lidas)
 * ✅ Paginação otimizada
 * ✅ Cache próprio e isolado
 */

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo, useCallback, useRef, useState, useEffect } from 'react';

// Query keys EXCLUSIVAS para WhatsApp Search
const whatsappSearchQueryKeys = {
  all: ['whatsapp-contacts-search'] as const,
  withFilters: (
    userId: string,
    searchTerm: string,
    filterType: string,
    instanceId?: string
  ) => [...whatsappSearchQueryKeys.all, 'user', userId, 'search', searchTerm, 'filter', filterType, 'instance', instanceId || 'all'] as const,
};

interface UseWhatsAppContactsSearchParams {
  activeInstanceId?: string | null;
  searchTerm?: string;
  filterType?: 'all' | 'unread';
  enabled?: boolean;
  pageSize?: number;
}

interface ContactData {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  company: string | null;
  document_id: string | null;
  notes: string | null;
  purchase_value: number | null;
  owner_id: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number | null;
  created_at: string;
  updated_at: string | null;
  whatsapp_number_id: string | null;
  kanban_stage_id: string | null;
  created_by_user_id: string;
  profile_pic_url: string | null;
  conversation_status: string | null;
}

// Converter dados do banco para Contact
const convertToContact = (data: ContactData): Contact => {
  return {
    id: data.id,
    name: data.name,
    phone: data.phone || '',
    email: data.email || undefined,
    address: data.address || undefined,
    company: data.company || undefined,
    documentId: data.document_id || undefined,
    notes: data.notes || undefined,
    purchaseValue: data.purchase_value || undefined,
    assignedUser: data.owner_id || 'Não atribuído',
    lastMessage: data.last_message || undefined,
    lastMessageTime: data.last_message_time || undefined,
    unreadCount: data.unread_count && data.unread_count > 0 ? data.unread_count : undefined,
    leadId: data.id,
    whatsapp_number_id: data.whatsapp_number_id || undefined,
    stageId: data.kanban_stage_id || null,
    createdAt: data.created_at,
    tags: [],
    instanceInfo: undefined,
    avatar: data.profile_pic_url || undefined,
    profilePicUrl: data.profile_pic_url || undefined
  };
};

export function useWhatsAppContactsSearch({
  activeInstanceId,
  searchTerm = '',
  filterType = 'all',
  enabled = true,
  pageSize = 50
}: UseWhatsAppContactsSearchParams) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Estado local para debounce da busca
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce do termo de busca
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const queryResult = useInfiniteQuery({
    queryKey: whatsappSearchQueryKeys.withFilters(
      user?.id || '',
      debouncedSearchTerm,
      filterType,
      activeInstanceId || undefined
    ),
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) {
        return { contacts: [], nextPage: null, totalCount: 0 };
      }

      console.log('[WhatsApp Search] 🔍 Buscando contatos com filtros:', {
        searchTerm: debouncedSearchTerm,
        filterType,
        activeInstanceId,
        page: pageParam
      });

      try {
        // Buscar role do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, created_by_user_id')
          .eq('id', user.id)
          .single();

        if (!profile) {
          throw new Error('Profile não encontrado');
        }

        // Query base
        let query = supabase
          .from('leads')
          .select(`
            id, name, phone, email, address, company, document_id, notes,
            purchase_value, owner_id, last_message, last_message_time,
            unread_count, created_at, updated_at, whatsapp_number_id,
            kanban_stage_id, created_by_user_id, profile_pic_url,
            conversation_status
          `, { count: 'exact' })
          .in('conversation_status', ['active', 'closed']);

        // Filtro multitenant
        if (profile.role === 'admin') {
          query = query.eq('created_by_user_id', user.id);
        } else {
          // Operacional: buscar instâncias acessíveis
          const { data: userWhatsAppNumbers } = await supabase
            .from('user_whatsapp_numbers')
            .select('whatsapp_number_id')
            .eq('profile_id', user.id);

          if (!userWhatsAppNumbers || userWhatsAppNumbers.length === 0) {
            query = query.eq('id', 'impossible-id');
          } else {
            const whatsappIds = userWhatsAppNumbers.map(uwn => uwn.whatsapp_number_id);
            query = query.in('whatsapp_number_id', whatsappIds);
          }
        }

        // Filtro por instância específica
        if (activeInstanceId) {
          query = query.eq('whatsapp_number_id', activeInstanceId);
        }

        // FILTRO DE BUSCA POR TEXTO
        if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
          const searchLower = debouncedSearchTerm.toLowerCase();
          const searchTrimmed = searchLower.trim();

          // Verificar se é uma busca numérica (apenas números)
          const isNumericSearch = /^\d+$/.test(searchTrimmed);

          if (isNumericSearch) {
            // Para busca numérica, procurar EXATAMENTE a sequência
            // Não usar % no início para evitar matches invertidos
            console.log('[WhatsApp Search] 🔢 Busca numérica detectada:', searchTrimmed);
            // Buscar números que COMEÇAM com ou CONTÊM a sequência exata
            query = query.or(`phone.ilike.${searchTrimmed}%,phone.ilike.%${searchTrimmed}%`);
          } else {
            // Para busca de texto, manter comportamento normal
            query = query.or(`name.ilike.%${searchLower}%,email.ilike.%${searchLower}%,company.ilike.%${searchLower}%,notes.ilike.%${searchLower}%`);
          }
        }

        // FILTRO POR TIPO (não lidas)
        if (filterType === 'unread') {
          query = query.gt('unread_count', 0);
        }

        // Ordenação e paginação
        query = query
          .order('last_message_time', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

        const { data, error, count } = await query;

        if (error) {
          console.error('[WhatsApp Search] ❌ Erro na query:', error);
          throw error;
        }

        console.log('[WhatsApp Search] ✅ Resultados:', {
          página: pageParam,
          resultados: data?.length || 0,
          total: count || 0
        });

        // Converter para formato Contact
        const contacts = (data as ContactData[] || []).map(convertToContact);

        // Buscar tags se houver contatos
        if (contacts.length > 0) {
          const leadIds = contacts.map(c => c.id);

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

          // Mapear tags aos contatos
          const tagsMap: Record<string, any[]> = {};
          (tagsData || []).forEach(item => {
            if (!tagsMap[item.lead_id]) {
              tagsMap[item.lead_id] = [];
            }
            tagsMap[item.lead_id].push(item.tags);
          });

          contacts.forEach(contact => {
            contact.tags = tagsMap[contact.id] || [];
          });
        }

        const totalCount = count || 0;
        const hasMore = ((pageParam + 1) * pageSize) < totalCount;

        return {
          contacts,
          nextPage: hasMore ? pageParam + 1 : null,
          totalCount
        };
      } catch (error) {
        console.error('[WhatsApp Search] ❌ Erro crítico:', error);
        return { contacts: [], nextPage: null, totalCount: 0 };
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user?.id && enabled,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true
  });

  // Achatar todas as páginas em uma lista única
  const allContacts = useMemo(() => {
    return queryResult.data?.pages?.flatMap(page => page.contacts) || [];
  }, [queryResult.data?.pages]);

  // Função para carregar mais
  const loadMore = useCallback(() => {
    if (queryResult.hasNextPage && !queryResult.isFetchingNextPage) {
      queryResult.fetchNextPage();
    }
  }, [queryResult]);

  // Função para refresh
  const refreshContacts = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: whatsappSearchQueryKeys.all
    });
  }, [queryClient]);

  // Função para mover contato ao topo (otimística)
  const moveContactToTop = useCallback((contactId: string, newMessage?: any) => {
    queryClient.setQueryData(
      whatsappSearchQueryKeys.withFilters(
        user?.id || '',
        debouncedSearchTerm,
        filterType,
        activeInstanceId || undefined
      ),
      (oldData: any) => {
        if (!oldData?.pages) return oldData;

        const newPages = [...oldData.pages];
        let targetContact: Contact | null = null;

        // Encontrar e remover o contato
        for (let i = 0; i < newPages.length; i++) {
          const contactIndex = newPages[i].contacts.findIndex((c: Contact) => c.id === contactId);
          if (contactIndex !== -1) {
            targetContact = newPages[i].contacts[contactIndex];
            newPages[i] = {
              ...newPages[i],
              contacts: [
                ...newPages[i].contacts.slice(0, contactIndex),
                ...newPages[i].contacts.slice(contactIndex + 1)
              ]
            };
            break;
          }
        }

        // Adicionar ao topo da primeira página
        if (targetContact && newPages[0]) {
          if (newMessage) {
            targetContact = {
              ...targetContact,
              lastMessage: newMessage.text || targetContact.lastMessage,
              lastMessageTime: newMessage.timestamp || new Date().toISOString()
            };
          }

          newPages[0] = {
            ...newPages[0],
            contacts: [targetContact, ...newPages[0].contacts]
          };
        }

        return { ...oldData, pages: newPages };
      }
    );
  }, [queryClient, user?.id, debouncedSearchTerm, filterType, activeInstanceId]);

  // Função para atualizar contador de não lidas
  const updateUnreadCount = useCallback((contactId: string, increment = true) => {
    queryClient.setQueryData(
      whatsappSearchQueryKeys.withFilters(
        user?.id || '',
        debouncedSearchTerm,
        filterType,
        activeInstanceId || undefined
      ),
      (oldData: any) => {
        if (!oldData?.pages) return oldData;

        const newPages = oldData.pages.map((page: any) => ({
          ...page,
          contacts: page.contacts.map((contact: Contact) => {
            if (contact.id === contactId) {
              const currentCount = contact.unreadCount || 0;
              return {
                ...contact,
                unreadCount: increment ? currentCount + 1 : 0
              };
            }
            return contact;
          })
        }));

        return { ...oldData, pages: newPages };
      }
    );
  }, [queryClient, user?.id, debouncedSearchTerm, filterType, activeInstanceId]);

  return {
    contacts: allContacts,
    isLoading: queryResult.isLoading,
    isFetchingNextPage: queryResult.isFetchingNextPage,
    hasNextPage: queryResult.hasNextPage,
    error: queryResult.error,
    refetch: queryResult.refetch,
    loadMore,
    totalCount: queryResult.data?.pages[0]?.totalCount || 0,
    refreshContacts,
    moveContactToTop,
    updateUnreadCount
  };
}