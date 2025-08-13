/**
 * 🎯 HOOK WHATSAPP CHAT - REFATORADO PARA USAR ORQUESTRADOR MODULAR
 * 
 * NOVA ARQUITETURA:
 * ✅ Usa orquestrador leve isolado
 * ✅ Features completamente isoladas
 * ✅ Cache por feature
 * ✅ Scroll e ordem de mensagens corrigidos
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Hooks isolados da estrutura correta
import { useWhatsAppInstances } from './useWhatsAppInstances';
import { useWhatsAppContacts } from './useWhatsAppContacts';
import { useWhatsAppMessages } from './chat/useWhatsAppMessages';
import { useWhatsAppRealtime } from './realtime/useWhatsAppRealtime';
import { Contact, Message } from '@/types/chat';

interface UseWhatsAppChatReturn {
  selectedContact: Contact | null;
  setSelectedContact: (contact: Contact | null) => void;
  activeInstance: any; // ✅ ADICIONADO para useSendMessage
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
  // isSendingMessage: REMOVIDO - usar useSendMessage isolado
  // sendMessage: REMOVIDO - usar useSendMessage isolado
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
    cacheStats: any;
  };
}

export const useWhatsAppChat = (): UseWhatsAppChatReturn => {
  console.log('[WhatsApp Chat] 🚀 HOOK EXECUTADO - INÍCIO');
  
  let user, leadId;
  try {
    const authResult = useAuth();
    user = authResult.user;
    console.log('[WhatsApp Chat] ✅ useAuth funcionou:', !!user);
  } catch (error) {
    console.error('[WhatsApp Chat] ❌ Erro em useAuth:', error);
    throw error;
  }
  
  try {
    const [searchParams] = useSearchParams();
    leadId = searchParams.get('leadId');
    console.log('[WhatsApp Chat] ✅ useSearchParams funcionou:', { leadId });
  } catch (error) {
    console.error('[WhatsApp Chat] ❌ Erro em useSearchParams:', error);
    throw error;
  }
  
  console.log('[WhatsApp Chat] 🎯 Hook principal inicializado:', {
    userId: user?.id,
    leadId,
    timestamp: new Date().toISOString()
  });
  
  // Estado compartilhado mínimo - SEM CENTRALIZADOR
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  console.log('[WhatsApp Chat] 🔍 Estado atual:', {
    hasSelectedContact: !!selectedContact,
    hasInitialized,
    selectedContactId: selectedContact?.id,
    selectedContactName: selectedContact?.name
  });
  
  // Hooks isolados - SEM ORQUESTRADOR
  console.log('[WhatsApp Chat] 🏗️ Inicializando hooks isolados...');
  
  let instances;
  try {
    instances = useWhatsAppInstances();
    console.log('[WhatsApp Chat] ✅ useWhatsAppInstances funcionou');
  } catch (error) {
    console.error('[WhatsApp Chat] ❌ Erro em useWhatsAppInstances:', error);
    throw error;
  }
  const contacts = useWhatsAppContacts({ 
    activeInstanceId: instances.activeInstance?.id 
  });
  
  console.log('[WhatsApp Chat] 📊 Status dos hooks isolados:', {
    instancesLoading: instances.isLoading,
    totalInstances: instances.totalInstances,
    activeInstanceId: instances.activeInstance?.id,
    contactsLoading: contacts.isLoading,
    totalContacts: contacts.contacts.length,
    contactsError: !contacts.contacts
  });
  
  // Adapter para compatibilidade de tipos
  const adaptedActiveInstance = useMemo(() => {
    // Preferir activeInstance; caso não exista, usar fallback por status 'open'
    const source = instances.activeInstance ||
      instances.instances?.find(i => {
        const status = i.connection_status?.toLowerCase?.() || '';
        return status === 'open' || status === 'connected' || status === 'ready';
      });

    if (!source) return null;

    const adapted = {
      id: source.id,
      instance_name: source.instance_name,
      connection_status: source.connection_status
    };
    console.log('[WhatsApp Chat] 🔧 Instância adaptada (com fallback):', adapted);
    return adapted;
  }, [instances.activeInstance, instances.instances]);
  
  const messages = useWhatsAppMessages({
    selectedContact,
    activeInstance: adaptedActiveInstance
  });
  
  console.log('[WhatsApp Chat] 📨 Status das mensagens:', {
    messagesLoading: messages.isLoading,
    totalMessages: messages.messages.length,
    hasSelectedContact: !!selectedContact,
    selectedContactId: selectedContact?.id
  });
  
  // Callbacks de comunicação entre features (ISOLADOS)
  const handleContactRefresh = useCallback(() => {
    console.log('[WhatsApp Chat] 🔄 Refresh de contatos isolado');
    contacts.refreshContacts();
  }, [contacts.refreshContacts]);

  const handleMoveContactToTop = useCallback((contactId: string, newMessage?: any) => {
    console.log('[WhatsApp Chat] 📈 Movendo contato para o topo (isolado):', contactId);
    contacts.moveContactToTop(contactId, newMessage);
  }, [contacts.moveContactToTop]);

  const handleUpdateUnreadCount = useCallback((contactId: string, increment = true) => {
    console.log('[WhatsApp Chat] 🔢 Atualizando contador (isolado):', { contactId, increment });
    contacts.updateUnreadCount(contactId, increment);
  }, [contacts.updateUnreadCount]);

  const handleAddNewContact = useCallback((newContactData: any) => {
    console.log('[WhatsApp Chat] ➕ Novo contato (isolado):', newContactData.name);
    contacts.addNewContact(newContactData);
  }, [contacts.addNewContact]);

  const handleNewMessage = useCallback((message: Message) => {
    console.log('[WhatsApp Chat] 📨 Nova mensagem (isolada):', {
      messageId: message.id,
      fromMe: message.fromMe,
      text: message.text.substring(0, 30) + '...'
    });

    // Processar mensagens - ISOLADO
    messages.addMessage(message);
    
    // Se não é do usuário atual, atualizar contatos
    if (!message.fromMe) {
      if (selectedContact?.id !== message.sender) {
        handleUpdateUnreadCount(selectedContact?.id || '', true);
      }
      
      handleMoveContactToTop(selectedContact?.id || '', message);
      
      if (!document.hasFocus()) {
        toast.info(`Nova mensagem de ${selectedContact?.name || 'Contato'}`, {
          description: message.text.substring(0, 60) + '...'
        });
      }
    }
  }, [messages.addMessage, selectedContact, handleUpdateUnreadCount, handleMoveContactToTop]);

  const handleMessageUpdate = useCallback((message: Message) => {
    console.log('[WhatsApp Chat] 🔄 Atualizando mensagem (isolada):', message.id);
    messages.updateMessage(message);
  }, [messages.updateMessage]);

  // Realtime isolado - SEM CENTRALIZADOR
  const realtime = useWhatsAppRealtime({
    // Para contatos
    activeInstanceId: instances.activeInstance?.id,
    onContactUpdate: handleContactRefresh,
    onMoveContactToTop: handleMoveContactToTop,
    onUpdateUnreadCount: handleUpdateUnreadCount,
    
    // Para mensagens
    selectedContact,
    activeInstance: adaptedActiveInstance,
    onNewMessage: handleNewMessage,
    onMessageUpdate: handleMessageUpdate
  });

  // Marcar como lida (isolado)
  const markAsRead = useCallback(async (contactId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ unread_count: 0 })
        .eq('id', contactId)
        .eq('created_by_user_id', user.id);
      
      if (error) throw error;
      
    } catch (error) {
      console.error('[WhatsApp Chat] ❌ Erro ao marcar como lida:', error);
    }
  }, [user?.id]);

  // Seleção de contato isolada
  const handleSelectContact = useCallback(async (contact: Contact | null) => {
    console.log('[WhatsApp Chat] 👆 Selecionando contato (isolado):', {
      contactName: contact?.name,
      contactId: contact?.id,
      hasUnreadCount: !!(contact?.unreadCount && contact.unreadCount > 0),
      unreadCount: contact?.unreadCount
    });
    
    if (contact && contact.unreadCount && contact.unreadCount > 0) {
      try {
        await markAsRead(contact.id);
        handleUpdateUnreadCount(contact.id, false);
      } catch (error) {
        console.error('[WhatsApp Chat] ❌ Erro ao marcar como lida:', error);
      }
    }
    
    setSelectedContact(contact);
    console.log('[WhatsApp Chat] ✅ Contato selecionado:', contact?.name);
  }, [markAsRead, handleUpdateUnreadCount]);

  // Auto-seleção de contato da URL (isolada) - com busca no banco se necessário
  useEffect(() => {
    if (leadId && !selectedContact && !hasInitialized && user?.id) {
      const findAndSelectContact = async () => {
        console.log('[WhatsApp Chat] 🎯 Procurando contato da URL:', leadId);
        console.log('[WhatsApp Chat] 📊 Estado atual:', {
          contactsLoaded: contacts.contacts.length,
          isLoadingContacts: contacts.isLoading,
          userId: user?.id
        });
        
        // Primeiro, tentar encontrar nos contatos já carregados (se houver)
        if (contacts.contacts.length > 0) {
          const targetContact = contacts.contacts.find(contact => contact.id === leadId);
          if (targetContact) {
            console.log('[WhatsApp Chat] ✅ Contato encontrado nos carregados:', targetContact.name);
            handleSelectContact(targetContact);
            setHasInitialized(true);
            return;
          }
        }
        
        // Se não encontrou nos carregados OU ainda não carregou contatos, buscar no banco
        console.log('[WhatsApp Chat] 🔍 Contato não encontrado nos carregados, buscando diretamente no banco...');
        try {
          const { data: leadData, error } = await supabase
            .from('leads')
            .select(`
              id, name, phone, email, address, company, document_id, notes, purchase_value, 
              owner_id, last_message, last_message_time, unread_count, created_at, updated_at,
              whatsapp_number_id, kanban_stage_id, created_by_user_id, profile_pic_url
            `)
            .eq('id', leadId)
            .eq('created_by_user_id', user.id)
            .maybeSingle();
          
          if (error) throw error;
          
          if (leadData) {
            console.log('[WhatsApp Chat] ✅ Contato encontrado no banco:', leadData.name);
            
            // Converter para formato Contact
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
              assignedUser: leadData.owner_id,
              lastMessage: leadData.last_message,
              lastMessageTime: leadData.last_message_time,
              unreadCount: leadData.unread_count && leadData.unread_count > 0 ? leadData.unread_count : undefined,
              leadId: leadData.id,
              whatsapp_number_id: leadData.whatsapp_number_id || undefined,
              stageId: leadData.kanban_stage_id || null,
              createdAt: leadData.created_at,
              tags: [], // Tags serão carregadas separadamente se necessário
              instanceInfo: undefined,
              avatar: leadData.profile_pic_url || undefined,
              profilePicUrl: leadData.profile_pic_url || undefined
            };
            
            // Adicionar aos contatos e selecionar
            console.log('[WhatsApp Chat] 📥 Adicionando contato da URL aos contatos carregados');
            contacts.addNewContact(contact);
            handleSelectContact(contact);
            
            toast.success(`Chat aberto com ${contact.name}`, {
              description: "Lead encontrado e carregado"
            });
          } else {
            console.log('[WhatsApp Chat] ⚠️ Contato não encontrado no banco:', leadId);
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
  }, [leadId, selectedContact, hasInitialized, user?.id, contacts.contacts.length, contacts.isLoading, handleSelectContact, contacts.addNewContact]);

  // Notificações de saúde (isoladas)
  useEffect(() => {
    if (!user?.id) return;
    
    if (instances.totalInstances > 0 && instances.connectedInstances === 0) {
      const timeoutId = setTimeout(() => {
        toast.error('🚨 Nenhuma instância WhatsApp conectada');
      }, 10000);

      return () => clearTimeout(timeoutId);
    }
  }, [instances.totalInstances, instances.connectedInstances, user?.id]);

  // Interface de compatibilidade - SEM CENTRALIZADOR
  return {
    // Estado compartilhado mínimo
    selectedContact,
    setSelectedContact: handleSelectContact,
    activeInstance: instances.activeInstance, // ✅ ADICIONADO para useSendMessage
    companyLoading: false,
    
    // Contatos isolados
    contacts: contacts.contacts,
    isLoadingContacts: contacts.isLoading,
    isLoadingMoreContacts: contacts.isLoadingMore,
    hasMoreContacts: contacts.hasMoreContacts,
    totalContactsAvailable: contacts.totalContactsAvailable,
    loadMoreContacts: contacts.loadMoreContacts,
    refreshContacts: contacts.refreshContacts,
    searchContacts: contacts.searchContacts,
    
    // Mensagens isoladas - COM SCROLL CORRIGIDO
    messages: messages.messages,
    isLoadingMessages: messages.isLoading,
    isLoadingMoreMessages: messages.isLoadingMore,
    hasMoreMessages: messages.hasMoreMessages,
    // isSendingMessage: REMOVIDO - usar useSendMessage isolado
    // sendMessage: REMOVIDO - usar useSendMessage isolado
    loadMoreMessages: messages.loadMoreMessages,
    refreshMessages: messages.refreshMessages,
    
    // Helpers isolados
    markAsRead,
    
    // Estatísticas isoladas
    instanceHealth: {
      score: instances.healthScore,
      isHealthy: instances.isHealthy,
      connectedInstances: instances.connectedInstances,
      totalInstances: instances.totalInstances
    },
    realtimeStats: {
      chatsConnected: realtime.isContactsConnected,
      messagesConnected: realtime.isMessagesConnected,
      totalChatsEvents: realtime.totalContactEvents,
      totalMessagesEvents: realtime.totalMessageEvents,
      lastChatsUpdate: realtime.lastContactUpdate,
      lastMessagesUpdate: realtime.lastMessageUpdate,
      chatsReconnectAttempts: realtime.contactsReconnectAttempts,
      messagesReconnectAttempts: realtime.messagesReconnectAttempts,
      queuedMessages: 0, // Não mais necessário com hooks isolados
      cacheStats: {} // Cache agora é isolado por feature
    }
  };
};