/**
 * 🎯 HOOK WHATSAPP CONTATOS - MIGRADO PARA REACT QUERY
 * 
 * RESPONSABILIDADES:
 * ✅ Gerenciar lista de contatos com React Query
 * ✅ Query keys isoladas (chat-contacts)
 * ✅ Cache automático do React Query
 * ✅ Paginação infinita
 * ✅ Invalidação automática
 */

import { useCallback, useRef, useState } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query';
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

const CONTACTS_LIMIT = 50;

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

// Função para buscar contatos
const fetchContacts = async (
  userId: string,
  activeInstanceId?: string | null,
  pageParam = 0
) => {
  console.log('[WhatsApp Contacts] 🚀 Buscando contatos via React Query:', {
    userId,
    activeInstanceId,
    offset: pageParam
  });

  // Query com filtro multitenant obrigatório
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
    .eq('created_by_user_id', userId)
    .in('conversation_status', ['active', 'closed'])
    .order('last_message_time', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  // Filtrar por instância se fornecida
  if (activeInstanceId) {
    query = query.eq('whatsapp_number_id', activeInstanceId);
  }

  const { data: leadsData, error, count } = await query
    .range(pageParam, pageParam + CONTACTS_LIMIT - 1);

  if (error) throw error;

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
    nextCursor: contacts.length === CONTACTS_LIMIT ? pageParam + CONTACTS_LIMIT : undefined,
    hasMore: contacts.length === CONTACTS_LIMIT,
    total: count || 0
  };
};

export const useWhatsAppContacts = ({ 
  activeInstanceId 
}: UseWhatsAppContactsParams = {}): UseWhatsAppContactsReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Estado para busca
  const [searchQuery, setSearchQuery] = useState('');
  const isSearchModeRef = useRef(false);

  // Query para contatos com paginação infinita
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: chatContactsQueryKeys.list(user?.id || ''),
    queryFn: ({ pageParam = 0 }) => {
      if (!user?.id) throw new Error('User ID required');
      return fetchContacts(user.id, activeInstanceId, pageParam);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
  });

  // Combinar todas as páginas de contatos
  const contacts = data?.pages.flatMap(page => page.contacts) || [];
  const totalContactsAvailable = data?.pages[0]?.total || 0;

  // Função para carregar mais contatos
  const loadMoreContacts = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Função para refresh
  const refreshContacts = useCallback(() => {
    console.log('[WhatsApp Contacts] 🔄 Refresh via React Query invalidation');
    queryClient.invalidateQueries({
      queryKey: chatContactsQueryKeys.base
    });
  }, [queryClient]);

  // Mutation para mover contato para o topo
  const moveContactToTop = useCallback((contactId: string, newMessage?: any) => {
    queryClient.setQueryData(
      chatContactsQueryKeys.list(user?.id || ''),
      (oldData: any) => {
        if (!oldData?.pages) return oldData;

        const newPages = [...oldData.pages];
        let contactToMove: Contact | null = null;
        
        // Encontrar e remover o contato de sua posição atual
        for (let i = 0; i < newPages.length; i++) {
          const contactIndex = newPages[i].contacts.findIndex(
            (c: Contact) => c.id === contactId
          );
          
          if (contactIndex !== -1) {
            contactToMove = { ...newPages[i].contacts[contactIndex] };
            newPages[i] = {
              ...newPages[i],
              contacts: newPages[i].contacts.filter((_: any, idx: number) => idx !== contactIndex)
            };
            break;
          }
        }

        // Se encontrou o contato, move para o topo
        if (contactToMove && newPages[0]) {
          if (newMessage) {
            contactToMove.lastMessage = newMessage.text || contactToMove.lastMessage;
            contactToMove.lastMessageTime = newMessage.timestamp || contactToMove.lastMessageTime;
          }
          
          newPages[0] = {
            ...newPages[0],
            contacts: [contactToMove, ...newPages[0].contacts]
          };
        }

        return { ...oldData, pages: newPages };
      }
    );
  }, [queryClient, user?.id]);

  // Mutation para atualizar contador de não lidas
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
        if (!oldData?.pages?.[0]) return oldData;

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
          contacts: [newContact, ...newPages[0].contacts]
        };

        return { ...oldData, pages: newPages };
      }
    );
  }, [queryClient, user?.id]);

  // Função para buscar contato por ID
  const getContactById = useCallback((contactId: string): Contact | null => {
    return contacts.find(contact => contact.id === contactId) || null;
  }, [contacts]);

  // Função para busca (placeholder - implementar se necessário)
  const searchContacts = useCallback(async (query: string) => {
    console.log('[WhatsApp Contacts] 🔍 Busca:', query);
    setSearchQuery(query);
    isSearchModeRef.current = query.trim().length > 0;
    // TODO: Implementar busca via React Query se necessário
  }, []);

  return {
    contacts,
    isLoading,
    isLoadingMore: isFetchingNextPage,
    hasMoreContacts: hasNextPage || false,
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