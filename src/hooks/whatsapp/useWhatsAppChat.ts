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
  companyLoading: boolean;
  contacts: Contact[];
  isLoadingContacts: boolean;
  isLoadingMoreContacts: boolean;
  hasMoreContacts: boolean;
  totalContactsAvailable: number;
  loadMoreContacts: () => Promise<void>;
  refreshContacts: () => void;
  messages: Message[];
  isLoadingMessages: boolean;
  isLoadingMoreMessages: boolean;
  hasMoreMessages: boolean;
  isSendingMessage: boolean;
  sendMessage: (text: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
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
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  
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
  const instances = useWhatsAppInstances();
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
    if (!instances.activeInstance) return null;
    const adapted = {
      id: instances.activeInstance.id,
      instance_name: instances.activeInstance.instance_name,
      connection_status: instances.activeInstance.connection_status
    };
    console.log('[WhatsApp Chat] 🔧 Instância adaptada:', adapted);
    return adapted;
  }, [instances.activeInstance]);
  
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

  // Auto-seleção de contato da URL (isolada)
  useEffect(() => {
    if (leadId && contacts.contacts.length > 0 && !selectedContact && !hasInitialized) {
      const targetContact = contacts.contacts.find(contact => contact.id === leadId);
      if (targetContact) {
        console.log('[WhatsApp Chat] 🎯 Auto-selecionando contato da URL:', targetContact.name);
        handleSelectContact(targetContact);
      }
      setHasInitialized(true);
    }
  }, [leadId, contacts.contacts, selectedContact, hasInitialized, handleSelectContact]);

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
    companyLoading: false,
    
    // Contatos isolados
    contacts: contacts.contacts,
    isLoadingContacts: contacts.isLoading,
    isLoadingMoreContacts: contacts.isLoadingMore,
    hasMoreContacts: contacts.hasMoreContacts,
    totalContactsAvailable: contacts.totalContactsAvailable,
    loadMoreContacts: contacts.loadMoreContacts,
    refreshContacts: contacts.refreshContacts,
    
    // Mensagens isoladas - COM SCROLL CORRIGIDO
    messages: messages.messages,
    isLoadingMessages: messages.isLoading,
    isLoadingMoreMessages: messages.isLoadingMore,
    hasMoreMessages: messages.hasMoreMessages,
    isSendingMessage: messages.isSendingMessage,
    sendMessage: messages.sendMessage,
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