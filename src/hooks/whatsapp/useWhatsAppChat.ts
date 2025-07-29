
/**
 * 🎯 HOOK PRINCIPAL SEM REFRESHES AUTOMÁTICOS
 * 
 * CORREÇÕES APLICADAS:
 * ✅ Callbacks otimizados sem duplicação
 * ✅ Validação rigorosa de multitenancy
 * ✅ Eliminação de refreshes desnecessários
 * ✅ Sistema de detecção de mensagens realmente novas
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
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
  // Estados principais
  selectedContact: Contact | null;
  setSelectedContact: (contact: Contact | null) => void;
  companyLoading: boolean;
  
  // Contatos
  contacts: Contact[];
  isLoadingContacts: boolean;
  isLoadingMoreContacts: boolean;
  hasMoreContacts: boolean;
  totalContactsAvailable: number;
  loadMoreContacts: () => Promise<void>;
  refreshContacts: () => void;
  
  // Mensagens
  messages: Message[];
  isLoadingMessages: boolean;
  isLoadingMoreMessages: boolean;
  hasMoreMessages: boolean;
  isSendingMessage: boolean;
  sendMessage: (text: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
  loadMoreMessages: () => Promise<void>;
  refreshMessages: () => void;
  
  // Ações
  markAsRead: (contactId: string) => Promise<void>;
  
  // Saúde do sistema
  instanceHealth: {
    score: number;
    isHealthy: boolean;
    connectedInstances: number;
    totalInstances: number;
  };
  
  // Estatísticas realtime
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
  
  // Hooks isolados
  const database = useWhatsAppDatabase();
  const activeInstance = useMemo(() => database.getActiveInstance(), [database.instances]);
  
  // Conversão para compatibilidade
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
  
  // 🚀 CORREÇÃO: Callbacks otimizados sem refreshes automáticos
  const handleContactRefresh = useCallback(() => {
    // Apenas refresh manual quando necessário
    console.log('[useWhatsAppChat] 🔄 Refresh manual de contatos');
    contacts.refreshContacts();
  }, [contacts]);

  const handleMoveContactToTop = useCallback((contactId: string, newMessage?: any) => {
    contacts.moveContactToTop(contactId, newMessage);
  }, [contacts]);

  const handleUpdateUnreadCount = useCallback((contactId: string, increment = true) => {
    contacts.updateUnreadCount(contactId, increment);
  }, [contacts]);

  const handleAddNewContact = useCallback((newContactData: any) => {
    contacts.addNewContact(newContactData);
  }, [contacts]);

  // ✅ CORREÇÃO: Callbacks sem duplicação e com validação rigorosa
  const handleNewMessage = useCallback((message: Message) => {
    // Só processar mensagens externas realmente novas
    if (!message.fromMe) {
      console.log('[useWhatsAppChat] 📨 Nova mensagem externa recebida:', message.id);
      messages.addOptimisticMessage(message);
    } else {
      console.log('[useWhatsAppChat] 🚫 Mensagem própria ignorada no realtime:', message.id);
    }
  }, [messages]);

  const handleMessageUpdate = useCallback((message: Message) => {
    console.log('[useWhatsAppChat] 🔄 Atualizando mensagem:', message.id);
    messages.updateMessage(message);
  }, [messages]);

  // Realtime hooks com validação rigorosa
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

  // Ações principais
  const markAsRead = useCallback(async (contactId: string) => {
    if (!user?.id) {
      return;
    }

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
    if (contact && contact.unreadCount && contact.unreadCount > 0) {
      try {
        await markAsRead(contact.id);
      } catch (error) {
        console.error('[useWhatsAppChat] ❌ Erro ao marcar como lida:', error);
      }
    }
    
    setSelectedContact(contact);
  }, [markAsRead]);

  // ✅ CORREÇÃO: Função sendMessage sem auto-refresh
  const sendMessage = useCallback(async (text: string, mediaType?: string, mediaUrl?: string): Promise<boolean> => {
    if (!user?.id) {
      return false;
    }

    console.log('[useWhatsAppChat] 📤 Enviando mensagem via hook principal');
    return await messages.sendMessage(text, mediaType, mediaUrl);
  }, [messages, user?.id]);

  // Saúde do sistema
  const instanceHealth = useMemo(() => ({
    score: database.healthScore,
    isHealthy: database.isHealthy,
    connectedInstances: database.connectedInstances,
    totalInstances: database.totalInstances
  }), [database.healthScore, database.isHealthy, database.connectedInstances, database.totalInstances]);

  // Estatísticas de realtime
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
        handleSelectContact(targetContact);
      }
      setHasInitialized(true);
    }
  }, [leadId, contacts.contacts, selectedContact, hasInitialized, handleSelectContact]);

  // 🚀 CORREÇÃO: Notificações de saúde apenas quando necessário
  useEffect(() => {
    if (!user?.id) return;
    
    if (database.totalInstances > 0 && database.connectedInstances === 0) {
      const timeoutId = setTimeout(() => {
        toast.error('🚨 Nenhuma instância WhatsApp conectada');
      }, 10000); // 10 segundos para evitar notificação prematura

      return () => clearTimeout(timeoutId);
    }
  }, [database.totalInstances, database.connectedInstances, user?.id]);

  // Listener para seleção via notificação (sem auto-refresh)
  useEffect(() => {
    if (!user?.id) return;
    
    const handleSelectContactEvent = (event: CustomEvent) => {
      const { contactId } = event.detail;
      
      const targetContact = contacts.contacts.find(contact => 
        contact.id === contactId || contact.leadId === contactId
      );
      
      if (targetContact) {
        handleSelectContact(targetContact);
      }
    };

    window.addEventListener('selectContact', handleSelectContactEvent as EventListener);
    
    return () => {
      window.removeEventListener('selectContact', handleSelectContactEvent as EventListener);
    };
  }, [contacts.contacts, handleSelectContact, user?.id]);

  return {
    // Estados principais
    selectedContact,
    setSelectedContact: handleSelectContact,
    companyLoading: false,
    
    // Contatos
    contacts: contacts.contacts,
    isLoadingContacts: contacts.isLoading,
    isLoadingMoreContacts: contacts.isLoadingMore,
    hasMoreContacts: contacts.hasMoreContacts,
    totalContactsAvailable: contacts.totalContactsAvailable,
    loadMoreContacts: contacts.loadMoreContacts,
    refreshContacts: handleContactRefresh,
    
    // Mensagens
    messages: messages.messages,
    isLoadingMessages: messages.isLoadingMessages,
    isLoadingMoreMessages: messages.isLoadingMore,
    hasMoreMessages: messages.hasMoreMessages,
    isSendingMessage: messages.isSendingMessage,
    sendMessage,
    loadMoreMessages: messages.loadMoreMessages,
    refreshMessages: messages.refreshMessages,
    
    // Ações
    markAsRead,
    
    // Saúde
    instanceHealth,
    realtimeStats
  };
};
