/**
 * 🎯 WHATSAPP CHAT UNIFIED
 *
 * Hook principal unificado que coordena todos os módulos
 * Substitui o hook monolítico useWhatsAppChat.ts
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Contact } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';

// Hooks modulares
import { useWhatsAppChatCoordinator } from './useWhatsAppChatCoordinator';
import { useWhatsAppContactsManager } from '../contacts/useWhatsAppContactsManager';
import { useWhatsAppMessagesManager } from '../messages/useWhatsAppMessagesManager';
import { useWhatsAppInstances } from '@/hooks/whatsapp/useWhatsAppInstances';

interface UseWhatsAppChatUnifiedReturn {
  // Contato selecionado
  selectedContact: Contact | null;
  setSelectedContact: (contact: Contact | null) => void;

  // Instância ativa
  activeInstance: { id: string; instance_name: string; connection_status: string } | null;
  companyLoading: boolean;

  // Contatos
  contacts: Contact[];
  isLoadingContacts: boolean;
  isLoadingMoreContacts: boolean;
  hasMoreContacts: boolean;
  totalContactsAvailable: number;
  loadMoreContacts: () => Promise<void>;
  refreshContacts: () => void;
  searchContacts: (query: string) => Promise<void>;

  // Mensagens
  messages: any[];
  isLoadingMessages: boolean;
  isLoadingMoreMessages: boolean;
  hasMoreMessages: boolean;
  loadMoreMessages: () => Promise<void>;
  refreshMessages: () => void;
  markAsRead: (contactId: string) => Promise<void>;

  // Health e Stats
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

export const useWhatsAppChatUnified = (): UseWhatsAppChatUnifiedReturn => {
  console.log('[WhatsApp Chat Unified] 🚀 Hook principal unificado inicializado');

  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Estado do contato selecionado
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Parâmetros da URL
  const leadId = searchParams.get('leadId');
  const phoneParam = searchParams.get('phone');

  console.log('[WhatsApp Chat Unified] 🎯 Parâmetros:', {
    userId: user?.id,
    leadId,
    phoneParam,
    selectedContactId: selectedContact?.id
  });

  // Hook coordenador
  const coordinator = useWhatsAppChatCoordinator();

  // Hook de instâncias (reutiliza existente)
  const instances = useWhatsAppInstances();

  // Adapter para instância ativa
  const activeInstance = useMemo(() => {
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

  // Hook de contatos modular
  const contactsManager = useWhatsAppContactsManager({
    activeInstanceId: activeInstance?.id,
    enableSearch: true,
    enableInfiniteScroll: true
  });

  // Hook de mensagens modular
  const messagesManager = useWhatsAppMessagesManager({
    selectedContact,
    activeInstanceId: activeInstance?.id,
    enableAutoRefresh: true
  });

  // Health calculation
  const instanceHealth = useMemo(() => {
    const totalInstances = instances.instances?.length || 0;
    const connectedInstances = instances.instances?.filter(i =>
      i.connection_status?.toLowerCase() === 'open' ||
      i.connection_status?.toLowerCase() === 'connected' ||
      i.connection_status?.toLowerCase() === 'ready'
    ).length || 0;

    const score = totalInstances > 0 ? (connectedInstances / totalInstances) * 100 : 0;

    return {
      score: Math.round(score),
      isHealthy: score >= 50,
      connectedInstances,
      totalInstances
    };
  }, [instances.instances]);

  // Realtime stats do coordinator
  const realtimeStats = useMemo(() => {
    const stats = coordinator.getStats();

    return {
      chatsConnected: true, // TODO: implementar real status
      messagesConnected: true,
      totalChatsEvents: stats.eventsByType['contact:update'] || 0,
      totalMessagesEvents: stats.eventsByType['message:new'] || 0,
      lastChatsUpdate: stats.lastEvent?.timestamp || null,
      lastMessagesUpdate: stats.lastEvent?.timestamp || null,
      chatsReconnectAttempts: 0, // TODO: implementar
      messagesReconnectAttempts: 0,
      queuedMessages: 0,
      cacheStats: {
        totalEvents: stats.totalEvents,
        activeSubscriptions: stats.activeSubscriptions
      }
    };
  }, [coordinator]);

  // Buscar lead específico da URL se fornecido
  useEffect(() => {
    if (!leadId || !user?.id || selectedContact?.id === leadId) return;

    console.log('[WhatsApp Chat Unified] 🔍 Buscando lead específico da URL:', leadId);

    // Buscar o lead específico no banco
    const fetchSpecificLead = async () => {
      try {
        // FILTRO MULTITENANT: Buscar role do usuário primeiro
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, created_by_user_id')
          .eq('id', user.id)
          .single();

        if (!profile) return;

        // Query para buscar o lead específico
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
          .eq('id', leadId)
          .in('conversation_status', ['active', 'closed']);

        // Aplicar filtro multitenant
        if (profile.role === 'admin') {
          query = query.eq('created_by_user_id', user.id);
        } else if (profile.role === 'operational' && profile.created_by_user_id) {
          // Buscar instâncias acessíveis para operacional
          const { data: userWhatsAppNumbers } = await supabase
            .from('user_whatsapp_numbers')
            .select('whatsapp_number_id')
            .eq('profile_id', user.id);

          if (userWhatsAppNumbers && userWhatsAppNumbers.length > 0) {
            const whatsappIds = userWhatsAppNumbers.map(uwn => uwn.whatsapp_number_id);
            query = query.in('whatsapp_number_id', whatsappIds);
          } else {
            return; // Usuário não tem acesso
          }
        }

        const { data: leadData, error } = await query.single();

        if (error) {
          console.error('[WhatsApp Chat Unified] ❌ Erro ao buscar lead específico:', error);
          return;
        }

        if (leadData) {
          // Converter para formato Contact
          const contact: Contact = {
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
            profilePicture: leadData.profile_pic_url || null,
            profilePicUrl: leadData.profile_pic_url || undefined
          };

          console.log('[WhatsApp Chat Unified] ✅ Lead específico encontrado, selecionando:', contact.name);
          setSelectedContact(contact);
        }
      } catch (error) {
        console.error('[WhatsApp Chat Unified] ❌ Erro ao buscar lead específico:', error);
      }
    };

    fetchSpecificLead();
  }, [leadId, user?.id, selectedContact?.id]);

  // Callbacks para compatibilidade
  const refreshContacts = useCallback(() => {
    console.log('[WhatsApp Chat Unified] 🔄 Refresh contatos solicitado');
    contactsManager.refresh();
  }, [contactsManager]);

  const searchContacts = useCallback(async (query: string) => {
    console.log('[WhatsApp Chat Unified] 🔍 Busca solicitada:', query);
    await contactsManager.search(query);
  }, [contactsManager]);

  const refreshMessages = useCallback(() => {
    console.log('[WhatsApp Chat Unified] 🔄 Refresh mensagens solicitado');
    messagesManager.refresh();
  }, [messagesManager]);

  const markAsRead = useCallback(async (contactId: string) => {
    console.log('[WhatsApp Chat Unified] 👁️ Marcar como lida:', contactId);
    await messagesManager.markAsRead(contactId);
  }, [messagesManager]);

  console.log('[WhatsApp Chat Unified] 📊 Status atual:', {
    contactsCount: contactsManager.contacts.length,
    messagesCount: messagesManager.messages.length,
    hasSelectedContact: !!selectedContact,
    instanceHealthScore: instanceHealth.score
  });

  return {
    // Contato selecionado
    selectedContact,
    setSelectedContact,

    // Instância
    activeInstance,
    companyLoading: instances.isLoading,

    // Contatos (do manager)
    contacts: contactsManager.contacts,
    isLoadingContacts: contactsManager.isLoading,
    isLoadingMoreContacts: contactsManager.isLoadingMore,
    hasMoreContacts: contactsManager.hasMore,
    totalContactsAvailable: contactsManager.totalAvailable,
    loadMoreContacts: contactsManager.loadMore,
    refreshContacts,
    searchContacts,

    // Mensagens (do manager)
    messages: messagesManager.messages,
    isLoadingMessages: messagesManager.isLoading,
    isLoadingMoreMessages: messagesManager.isLoadingMore,
    hasMoreMessages: messagesManager.hasMore,
    loadMoreMessages: messagesManager.loadMore,
    refreshMessages,
    markAsRead,

    // Health e Stats
    instanceHealth,
    realtimeStats
  };
};