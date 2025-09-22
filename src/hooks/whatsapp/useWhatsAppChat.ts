/**
 * 🎯 HOOK WHATSAPP CHAT - MIGRADO PARA REACT QUERY
 * 
 * NOVA ARQUITETURA COM REACT QUERY:
 * ✅ Query keys isoladas (chat-*)
 * ✅ Cache automático e inteligente
 * ✅ Invalidação automática via real-time
 * ✅ Performance otimizada
 * ✅ Sincronização garantida
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useChatFilters } from '@/hooks/shared/filters';

// Hooks isolados NOVOS (React Query)
import { useWhatsAppInstances } from './useWhatsAppInstances';
import { useWhatsAppContacts } from './useWhatsAppContactsInfinite'; // SCROLL INFINITO VERSION
import { useWhatsAppContactsSearch } from './useWhatsAppContactsSearch'; // HOOK ISOLADO DE BUSCA
import { useWhatsAppMessages } from './chat/useWhatsAppMessages'; // REACT QUERY VERSION
import { useContactsRealtime } from './realtime/useContactsRealtime'; // REAL-TIME ISOLADO PARA CONTATOS
import { useMessagesRealtime } from './realtime/useMessagesRealtime'; // REAL-TIME ISOLADO PARA MENSAGENS
import { Contact, Message } from '@/types/chat';
import { readMessagesService } from '@/services/whatsapp/readMessagesService';

// Query keys isoladas APENAS do Chat
import { chatContactsQueryKeys, chatMessagesQueryKeys } from '@/hooks/chat/queryKeys';

// Version control para cache busting
import { WHATSAPP_HOOKS_VERSION, isNewVersion } from './version';

interface UseWhatsAppChatReturn {
  selectedContact: Contact | null;
  setSelectedContact: (contact: Contact | null) => void;
  activeInstance: { id: string; instance_name: string; connection_status: string } | null;
  companyLoading: boolean;
  contacts: Contact[];
  isLoadingContacts: boolean;
  isLoadingMoreContacts: boolean;
  hasMoreContacts: boolean;
  totalContactsAvailable: number;
  loadMoreContacts: () => Promise<void>;
  refreshContacts: () => void;
  searchContacts: (query: string) => Promise<void>;
  messages: Message[];
  isLoadingMessages: boolean;
  isLoadingMoreMessages: boolean;
  hasMoreMessages: boolean;
  loadMoreMessages: () => Promise<void>;
  refreshMessages: () => void;
  markAsRead: (contactId: string) => Promise<void>;
  instanceHealth: {
    score: number;
    isHealthy: boolean;
    connectedInstances: number;
    totalInstances: number;
  };
  realtimeStats: {
    chatsConnected: boolean;
    messagesConnected: boolean;
    totalChatsEvents: number;
    totalMessagesEvents: number;
    lastChatsUpdate: number | null;
    lastMessagesUpdate: number | null;
    chatsReconnectAttempts: number;
    messagesReconnectAttempts: number;
    queuedMessages: number;
    cacheStats: Record<string, unknown>;
  };
}

export const useWhatsAppChat = (): UseWhatsAppChatReturn => {
  // Verificar versão para cache busting
  isNewVersion();
  
  console.log('[WhatsApp Chat] 🚀🚀🚀 HOOK EXECUTADO COM REACT QUERY V2.0 CACHE BUSTER - INÍCIO');
  console.warn(`🔥 CACHE BUSTER ATIVO - VERSÃO ${WHATSAPP_HOOKS_VERSION} DO HOOK CHAT PRINCIPAL CARREGADA! 🔥`);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const dataFilters = useChatFilters();
  
  const leadId = searchParams.get('leadId');
  const phoneParam = searchParams.get('phone');
  
  console.log('[WhatsApp Chat] 🎯 Hook principal inicializado com React Query:', {
    userId: user?.id,
    leadId,
    phoneParam,
    timestamp: new Date().toISOString()
  });
  
  // Estado compartilhado mínimo
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');
  
  // Hooks isolados COM REACT QUERY
  const instances = useWhatsAppInstances();

  // Usar hook normal quando não há busca
  const normalContacts = useWhatsAppContacts({
    activeInstanceId: instances.activeInstance?.id
  });

  // Usar hook de busca quando há filtros
  const searchContacts = useWhatsAppContactsSearch({
    activeInstanceId: instances.activeInstance?.id,
    searchTerm: searchQuery,
    filterType: filterType,
    enabled: !!searchQuery || filterType !== 'all'
  });

  // Escolher qual hook usar baseado nos filtros
  const hasFilters = !!searchQuery || filterType !== 'all';
  const contacts = hasFilters ? searchContacts : normalContacts;
  
  // Adapter para compatibilidade
  const adaptedActiveInstance = useMemo(() => {
    const source = instances.activeInstance ||
      instances.instances?.find(i => {
        const status = i.connection_status?.toLowerCase?.() || '';
        return status === 'open' || status === 'connected' || status === 'ready';
      });

    if (!source) return null;

    return {
      id: source.id,
      instance_name: source.instance_name,
      connection_status: source.connection_status
    };
  }, [instances.activeInstance, instances.instances]);
  
  const messages = useWhatsAppMessages({
    selectedContact,
    activeInstance: adaptedActiveInstance
  });
  
  // Callbacks para comunicação com real-time (React Query otimizado)
  const handleContactRefresh = useCallback(() => {
    console.log('[WhatsApp Chat] 🔄 Refresh de contatos via React Query');
    queryClient.invalidateQueries({
      queryKey: chatContactsQueryKeys.base
    });
  }, [queryClient]);

  const handleMoveContactToTop = useCallback((contactId: string, newMessage?: unknown) => {
    console.log('[WhatsApp Chat] 📈 Movendo contato para o topo via React Query:', contactId);
    contacts.moveContactToTop(contactId, newMessage);
  }, [contacts]);

  const handleUpdateUnreadCount = useCallback((contactId: string, increment = true) => {
    console.log('[WhatsApp Chat] 🔢 Atualizando contador via React Query:', { contactId, increment });
    contacts.updateUnreadCount(contactId, increment);
  }, [contacts]);

  const handleAddNewContact = useCallback((newContactData: Record<string, unknown>) => {
    console.log('[WhatsApp Chat] ➕ Novo contato via React Query:', newContactData.name);
    contacts.addNewContact(newContactData);
  }, [contacts]);

  const handleNewMessage = useCallback((message: Message) => {
    console.log('[WhatsApp Chat] 📨 Nova mensagem via React Query:', {
      messageId: message.id,
      fromMe: message.fromMe,
      text: message.text.substring(0, 30) + '...'
    });

    // Processar mensagens via React Query
    messages.addMessage(message);
    
    // Apenas processar mensagens recebidas (fromMe: false)
    if (!message.fromMe) {
      console.log('[WhatsApp Chat] 📬 Processando mensagem recebida via React Query');
      
      // Atualizar contador de não lidas apenas para mensagens recebidas
      if (selectedContact?.id !== message.sender) {
        handleUpdateUnreadCount(selectedContact?.id || '', true);
      }
      
      // Mover contato para o topo
      handleMoveContactToTop(selectedContact?.id || '', message);
      
      // Notificação apenas para mensagens recebidas
      if (!document.hasFocus()) {
        toast.info(`Nova mensagem de ${selectedContact?.name || 'Contato'}`, {
          description: message.text.substring(0, 60) + '...'
        });
      }
    }
  }, [messages, selectedContact, handleUpdateUnreadCount, handleMoveContactToTop]);

  const handleMessageUpdate = useCallback((message: Message) => {
    console.log('[WhatsApp Chat] 🔄 Atualizando mensagem via React Query:', message.id);
    messages.updateMessage(message);
  }, [messages]);

  // Real-time ISOLADO para contatos
  const contactsRealtime = useContactsRealtime({
    activeInstanceId: instances.activeInstance?.id,
    onContactUpdate: handleContactRefresh,
    onMoveContactToTop: handleMoveContactToTop,
    onUpdateUnreadCount: handleUpdateUnreadCount
  });

  // Real-time ISOLADO para mensagens
  const messagesRealtime = useMessagesRealtime({
    selectedContact,
    activeInstance: adaptedActiveInstance,
    onNewMessage: handleNewMessage,
    onMessageUpdate: handleMessageUpdate
  });

  // Marcar como lida (React Query otimizado)
  const markAsRead = useCallback(async (contactId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ unread_count: 0 })
        .eq('id', contactId)
        .eq('created_by_user_id', user.id);
      
      if (error) throw error;
      
      // Invalidar contatos para refletir mudança
      queryClient.invalidateQueries({
        queryKey: chatContactsQueryKeys.list(user.id)
      });
      
    } catch (error) {
      console.error('[WhatsApp Chat] ❌ Erro ao marcar como lida:', error);
    }
  }, [user?.id, queryClient]);

  // Seleção de contato com React Query
  const handleSelectContact = useCallback(async (contact: Contact | null) => {
    console.log('[WhatsApp Chat] 👆 Selecionando contato via React Query:', {
      contactName: contact?.name,
      contactId: contact?.id,
      hasUnreadCount: !!(contact?.unreadCount && contact.unreadCount > 0)
    });
    
    if (contact && contact.unreadCount && contact.unreadCount > 0) {
      try {
        // Marcar como lida no CRM
        await markAsRead(contact.id);
        handleUpdateUnreadCount(contact.id, false);
        
        // Sincronizar com WhatsApp nativo
        if (user?.id && instances.activeInstance?.id) {
          console.log('[WhatsApp Chat] 👁️ Sincronizando leitura com WhatsApp nativo');
          
          try {
            await readMessagesService.syncConversationOnOpen(
              contact.id,
              instances.activeInstance.id,
              user.id
            );
            
            console.log('[WhatsApp Chat] ✅ Sincronização WhatsApp concluída');
          } catch (syncError) {
            console.error('[WhatsApp Chat] ⚠️ Erro na sincronização WhatsApp (não crítico):', syncError);
          }
        }
        
      } catch (error) {
        console.error('[WhatsApp Chat] ❌ Erro ao marcar como lida:', error);
      }
    }
    
    setSelectedContact(contact);
    console.log('[WhatsApp Chat] ✅ Contato selecionado via React Query:', contact?.name);
  }, [markAsRead, handleUpdateUnreadCount, user?.id, instances.activeInstance?.id]);

  // Auto-seleção de contato da URL (com React Query) - aguardando filtros carregarem
  useEffect(() => {
    if ((leadId || phoneParam) && !selectedContact && !hasInitialized && user?.id && !dataFilters.loading && dataFilters.role) {
      const findAndSelectContact = async () => {
        console.log('[WhatsApp Chat] 🎯 Procurando contato da URL via React Query:', { leadId, phoneParam });
        
        // Primeiro, tentar encontrar nos contatos já carregados
        if (contacts.contacts.length > 0) {
          let targetContact;
          
          if (leadId) {
            targetContact = contacts.contacts.find(contact => contact.id === leadId);
          } else if (phoneParam) {
            const cleanPhoneParam = phoneParam.replace(/\D/g, '');
            targetContact = contacts.contacts.find(contact => {
              const cleanContactPhone = contact.phone.replace(/\D/g, '');
              return cleanContactPhone.includes(cleanPhoneParam) || cleanPhoneParam.includes(cleanContactPhone);
            });
          }
          
          if (targetContact) {
            console.log('[WhatsApp Chat] ✅ Contato encontrado nos carregados via React Query:', targetContact.name);
            handleSelectContact(targetContact);
            setHasInitialized(true);
            return;
          }
        }
        
        // Se não encontrou, buscar no banco com filtros baseados no role
        console.log('[WhatsApp Chat] 🔍 Buscando contato no banco via React Query com filtros por role:', {
          role: dataFilters.role,
          loading: dataFilters.loading
        });
        
        if (dataFilters.loading || !dataFilters.role) {
          console.log('[WhatsApp Chat] ⏳ Aguardando carregamento dos filtros de permissão...');
          return;
        }
        
        try {
          let query = supabase
            .from('leads')
            .select(`
              id, name, phone, email, address, company, document_id, notes, purchase_value, 
              owner_id, last_message, last_message_time, unread_count, created_at, updated_at,
              whatsapp_number_id, kanban_stage_id, created_by_user_id, profile_pic_url
            `);

          // 🚀 CORREÇÃO: Aplicar filtros baseados no role do usuário
          if (dataFilters.role === 'admin') {
            query = query.eq('created_by_user_id', user.id);
          } else if (dataFilters.role === 'operational') {
            // Operacional: buscar por instâncias WhatsApp atribuídas + admin que criou
            const { data: userWhatsAppNumbers } = await supabase
              .from('user_whatsapp_numbers')
              .select('whatsapp_number_id')
              .eq('profile_id', user.id);

            if (!userWhatsAppNumbers || userWhatsAppNumbers.length === 0) {
              console.log('[WhatsApp Chat] ⚠️ Usuário operacional sem instâncias WhatsApp atribuídas');
              toast.error('Você não tem permissão para acessar este lead');
              return;
            }

            const whatsappIds = userWhatsAppNumbers.map(uwn => uwn.whatsapp_number_id);
            
            // Buscar o admin que criou o usuário operacional
            const { data: profile } = await supabase
              .from('profiles')
              .select('created_by_user_id')
              .eq('id', user.id)
              .single();

            const adminId = profile?.created_by_user_id || user.id;
            
            query = query
              .in('whatsapp_number_id', whatsappIds)
              .eq('created_by_user_id', adminId);
              
            console.log('[WhatsApp Chat] 🎯 Filtros operacionais aplicados:', {
              whatsappIds,
              adminId,
              userProfile: profile
            });
          }
          
          if (leadId) {
            query = query.eq('id', leadId);
          } else if (phoneParam) {
            const cleanPhone = phoneParam.replace(/\D/g, '');
            query = query.or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${cleanPhone.slice(-11)}%,phone.ilike.%${cleanPhone.slice(-10)}%`);
          }
          
          const { data: leadData, error } = await query.maybeSingle();
          
          if (error) throw error;
          
          if (leadData) {
            console.log('[WhatsApp Chat] ✅ Contato encontrado no banco via React Query:', leadData.name);
            
            const contact = {
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
              tags: [],
              instanceInfo: undefined,
              avatar: leadData.profile_pic_url || undefined,
              profilePicUrl: leadData.profile_pic_url || undefined
            };
            
            // Adicionar aos contatos via React Query e selecionar
            contacts.addNewContact(contact);
            handleSelectContact(contact);
            
            toast.success(`Chat aberto com ${contact.name}`, {
              description: "Lead encontrado e carregado"
            });
          } else {
            console.log('[WhatsApp Chat] ⚠️ Contato não encontrado no banco');
            toast.error('Lead não encontrado ou não pertence ao usuário');
          }
        } catch (error) {
          console.error('[WhatsApp Chat] ❌ Erro ao buscar contato no banco:', error);
          toast.error('Erro ao carregar lead');
        }
        
        setHasInitialized(true);
      };
      
      findAndSelectContact();
    }
  }, [leadId, phoneParam, selectedContact, hasInitialized, user?.id, contacts, handleSelectContact, dataFilters.loading, dataFilters.role]);

  // Notificações de saúde
  useEffect(() => {
    if (!user?.id) return;
    
    if (instances.totalInstances > 0 && instances.connectedInstances === 0) {
      const timeoutId = setTimeout(() => {
        toast.error('🚨 Nenhuma instância WhatsApp conectada');
      }, 10000);

      return () => clearTimeout(timeoutId);
    }
  }, [instances.totalInstances, instances.connectedInstances, user?.id]);

  // Interface de compatibilidade COM REACT QUERY
  return {
    // Estado compartilhado mínimo
    selectedContact,
    setSelectedContact: handleSelectContact,
    activeInstance: instances.activeInstance,
    companyLoading: false,
    
    // Contatos via React Query
    contacts: contacts.contacts,
    isLoadingContacts: contacts.isLoading,
    isLoadingMoreContacts: contacts.isLoadingMore,
    hasMoreContacts: contacts.hasMoreContacts,
    totalContactsAvailable: contacts.totalContactsAvailable,
    loadMoreContacts: contacts.loadMoreContacts,
    refreshContacts: contacts.refreshContacts,
    searchContacts: async (query: string) => {
      console.log('[WhatsApp Chat] 🔍 Definindo query de busca:', query);
      setSearchQuery(query);
    },
    
    // Mensagens via React Query
    messages: messages.messages,
    isLoadingMessages: messages.isLoading,
    isLoadingMoreMessages: messages.isLoadingMore,
    hasMoreMessages: messages.hasMoreMessages,
    loadMoreMessages: messages.loadMoreMessages,
    refreshMessages: messages.refreshMessages,
    
    // Helpers
    markAsRead,
    
    // Estatísticas
    instanceHealth: {
      score: instances.healthScore,
      isHealthy: instances.isHealthy,
      connectedInstances: instances.connectedInstances,
      totalInstances: instances.totalInstances
    },
    realtimeStats: {
      chatsConnected: contactsRealtime.isConnected,
      messagesConnected: messagesRealtime.isConnected,
      totalChatsEvents: contactsRealtime.totalEvents,
      totalMessagesEvents: messagesRealtime.totalEvents,
      lastChatsUpdate: contactsRealtime.lastUpdate,
      lastMessagesUpdate: messagesRealtime.lastUpdate,
      chatsReconnectAttempts: contactsRealtime.reconnectAttempts,
      messagesReconnectAttempts: messagesRealtime.reconnectAttempts,
      queuedMessages: 0, // React Query gerencia automaticamente
      processedMessages: messagesRealtime.processedCount,
      duplicateMessages: messagesRealtime.duplicateCount,
      cacheStats: {
        reactQuery: 'enabled',
        isolation: 'complete-separated-hooks',
        contactsIsolated: 'useContactsRealtime',
        messagesIsolated: 'useMessagesRealtime'
      }
    }
  };
};