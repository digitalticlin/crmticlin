
/**
 * 🎯 HOOK PRINCIPAL OTIMIZADO - SEM RERENDERS EXCESSIVOS
 * 
 * CORREÇÕES APLICADAS:
 * ✅ useCallback com dependências corretas
 * ✅ useMemo para valores estáveis
 * ✅ Eliminação de recriações desnecessárias
 * ✅ Logs otimizados
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useWhatsAppDatabase } from './useWhatsAppDatabase';
import { useWhatsAppContacts } from './useWhatsAppContacts';
import { useWhatsAppChatMessages } from './chat/useWhatsAppChatMessages';
import { useChatsRealtime } from './realtime/useChatsRealtime';
import { useMessagesRealtime } from './realtime/useMessagesRealtime';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  
  // Estado global mínimo
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Refs para estabilidade
  const callbacksInitialized = useRef(false);
  
  // Hooks isolados
  const database = useWhatsAppDatabase();
  
  // 🚀 CORREÇÃO: Memoizar instância ativa
  const activeInstance = useMemo(() => database.getActiveInstance(), [database.instances]);
  
  // Conversão estável para compatibilidade
  const webActiveInstance = useMemo((): WhatsAppWebInstance | null => {
    if (!activeInstance) return null;
    
    return {
      id: activeInstance.id,
      instance_name: activeInstance.instance_name,
      connection_type: activeInstance.connection_type || 'web',
      server_url: activeInstance.server_url || '',
      vps_instance_id: activeInstance.vps_instance_id || '',
      web_status: activeInstance.web_status || '',
      connection_status: activeInstance.connection_status as any,
      qr_code: activeInstance.qr_code,
      phone: activeInstance.phone,
      profile_name: activeInstance.profile_name,
      profile_pic_url: activeInstance.profile_pic_url,
      date_connected: activeInstance.date_connected,
      date_disconnected: activeInstance.date_disconnected,
      created_by_user_id: activeInstance.created_by_user_id || '',
      created_at: activeInstance.created_at || new Date().toISOString(),
      updated_at: activeInstance.updated_at || new Date().toISOString()
    };
  }, [activeInstance]);

  // Hook de contatos
  const contacts = useWhatsAppContacts(webActiveInstance?.id);
  
  // Hook de mensagens
  const messages = useWhatsAppChatMessages({
    selectedContact,
    activeInstance: webActiveInstance
  });
  
  // 🚀 CORREÇÃO: Callbacks estáveis com useCallback
  const handleContactRefresh = useCallback(() => {
    console.log('[useWhatsAppChat] 🔄 Refresh manual de contatos');
    contacts.refreshContacts();
  }, [contacts.refreshContacts]);

  const handleMoveContactToTop = useCallback((contactId: string, newMessage?: any) => {
    console.log('[useWhatsAppChat] 📈 Movendo contato para o topo:', contactId);
    contacts.moveContactToTop(contactId, newMessage);
  }, [contacts.moveContactToTop]);

  const handleUpdateUnreadCount = useCallback((contactId: string, increment = true) => {
    console.log('[useWhatsAppChat] 🔢 Atualizando contador:', { contactId, increment });
    contacts.updateUnreadCount(contactId, increment);
  }, [contacts.updateUnreadCount]);

  const handleAddNewContact = useCallback((newContactData: any) => {
    console.log('[useWhatsAppChat] ➕ Novo contato:', newContactData.name);
    contacts.addNewContact(newContactData);
  }, [contacts.addNewContact]);

  // ✅ Callbacks de mensagens otimizados
  const handleNewMessage = useCallback((message: Message) => {
    console.log('[useWhatsAppChat] 📨 NOVA MENSAGEM:', {
      messageId: message.id,
      fromMe: message.fromMe,
      isIncoming: message.isIncoming,
      text: message.text.substring(0, 30) + '...',
      selectedContactId: selectedContact?.id
    });

    // Processar mensagens externas
    if (!message.fromMe) {
      console.log('[useWhatsAppChat] ✅ Processando mensagem EXTERNA');
      messages.addOptimisticMessage(message);
      
      // Atualizar contador apenas se não for o contato ativo
      if (selectedContact?.id !== message.sender) {
        handleUpdateUnreadCount(selectedContact?.id || '', true);
      }
      
      // Mover contato para o topo
      handleMoveContactToTop(selectedContact?.id || '', message);
      
      // Notificação se janela não estiver em foco
      if (!document.hasFocus()) {
        toast.info(`Nova mensagem de ${selectedContact?.name || 'Contato'}`, {
          description: message.text.substring(0, 60) + '...'
        });
      }
    } else {
      console.log('[useWhatsAppChat] ✅ Processando mensagem PRÓPRIA');
      messages.addOptimisticMessage(message);
    }
  }, [messages.addOptimisticMessage, selectedContact, handleUpdateUnreadCount, handleMoveContactToTop]);

  const handleMessageUpdate = useCallback((message: Message) => {
    console.log('[useWhatsAppChat] 🔄 Atualizando mensagem:', {
      messageId: message.id,
      status: message.status
    });
    messages.updateMessage(message);
  }, [messages.updateMessage]);

  // Realtime hooks com callbacks estáveis
  const chatsRealtime = useChatsRealtime({
    activeInstanceId: webActiveInstance?.id || null,
    onContactUpdate: handleContactRefresh,
    onNewContact: handleContactRefresh,
    onContactsRefresh: handleContactRefresh,
    onMoveContactToTop: handleMoveContactToTop,
    onUpdateUnreadCount: handleUpdateUnreadCount,
    onAddNewContact: handleAddNewContact
  });

  const messagesRealtime = useMessagesRealtime({
    selectedContact,
    activeInstance: webActiveInstance,
    onNewMessage: handleNewMessage,
    onMessageUpdate: handleMessageUpdate
  });

  // ✅ markAsRead otimizado
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
      console.error('[useWhatsAppChat] ❌ Erro ao marcar como lida:', error);
    }
  }, [user?.id]);

  const handleSelectContact = useCallback(async (contact: Contact | null) => {
    console.log('[useWhatsAppChat] 👆 Selecionando contato:', contact?.name);
    
    if (contact && contact.unreadCount && contact.unreadCount > 0) {
      try {
        await markAsRead(contact.id);
      } catch (error) {
        console.error('[useWhatsAppChat] ❌ Erro ao marcar como lida:', error);
      }
    }
    
    setSelectedContact(contact);
  }, [markAsRead]);

  // ✅ sendMessage otimizado
  const sendMessage = useCallback(async (text: string, mediaType?: string, mediaUrl?: string): Promise<boolean> => {
    if (!user?.id) {
      console.error('[useWhatsAppChat] ❌ Usuário não logado');
      return false;
    }

    console.log('[useWhatsAppChat] 📤 Enviando mensagem:', {
      text: text.substring(0, 30) + '...',
      contact: selectedContact?.name,
      mediaType
    });
    
    return await messages.sendMessage(text, mediaType, mediaUrl);
  }, [messages.sendMessage, user?.id, selectedContact?.name]);

  // 🚀 CORREÇÃO: Memoizar valores estáveis
  const instanceHealth = useMemo(() => ({
    score: database.healthScore,
    isHealthy: database.isHealthy,
    connectedInstances: database.connectedInstances,
    totalInstances: database.totalInstances
  }), [database.healthScore, database.isHealthy, database.connectedInstances, database.totalInstances]);

  const realtimeStats = useMemo(() => ({
    chatsConnected: chatsRealtime.isConnected,
    messagesConnected: messagesRealtime.isConnected,
    totalChatsEvents: chatsRealtime.totalEvents,
    totalMessagesEvents: 0,
    lastChatsUpdate: chatsRealtime.lastUpdate,
    lastMessagesUpdate: null,
    chatsReconnectAttempts: chatsRealtime.reconnectAttempts,
    messagesReconnectAttempts: messagesRealtime.reconnectAttempts,
    queuedMessages: messagesRealtime.queuedMessages,
    cacheStats: database.cacheStats
  }), [chatsRealtime, messagesRealtime, database.cacheStats]);

  // Auto-seleção de contato da URL
  useEffect(() => {
    if (leadId && contacts.contacts.length > 0 && !selectedContact && !hasInitialized) {
      const targetContact = contacts.contacts.find(contact => contact.id === leadId);
      if (targetContact) {
        console.log('[useWhatsAppChat] 🎯 Auto-selecionando contato da URL:', targetContact.name);
        handleSelectContact(targetContact);
      }
      setHasInitialized(true);
    }
  }, [leadId, contacts.contacts, selectedContact, hasInitialized, handleSelectContact]);

  // Notificações de saúde apenas quando necessário
  useEffect(() => {
    if (!user?.id) return;
    
    if (database.totalInstances > 0 && database.connectedInstances === 0) {
      const timeoutId = setTimeout(() => {
        toast.error('🚨 Nenhuma instância WhatsApp conectada');
      }, 10000);

      return () => clearTimeout(timeoutId);
    }
  }, [database.totalInstances, database.connectedInstances, user?.id]);

  return {
    selectedContact,
    setSelectedContact: handleSelectContact,
    companyLoading: false,
    contacts: contacts.contacts,
    isLoadingContacts: contacts.isLoading,
    isLoadingMoreContacts: contacts.isLoadingMore,
    hasMoreContacts: contacts.hasMoreContacts,
    totalContactsAvailable: contacts.totalContactsAvailable,
    loadMoreContacts: contacts.loadMoreContacts,
    refreshContacts: handleContactRefresh,
    messages: messages.messages,
    isLoadingMessages: messages.isLoadingMessages,
    isLoadingMoreMessages: messages.isLoadingMore,
    hasMoreMessages: messages.hasMoreMessages,
    isSendingMessage: messages.isSendingMessage,
    sendMessage,
    loadMoreMessages: messages.loadMoreMessages,
    refreshMessages: messages.refreshMessages,
    markAsRead,
    instanceHealth,
    realtimeStats
  };
};
