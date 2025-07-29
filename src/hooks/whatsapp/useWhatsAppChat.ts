
/**
 * 🎯 HOOK PRINCIPAL CORRIGIDO - MULTITENANCY E RESILÊNCIA
 * 
 * CORREÇÕES APLICADAS:
 * ✅ Conexão direta com useAuth (sem useCompanyData)
 * ✅ Validação rigorosa de multitenancy
 * ✅ Callbacks otimizados sem duplicação
 * ✅ Estatísticas de realtime melhoradas
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
  
  // Estatísticas realtime melhoradas
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
  const { user } = useAuth(); // 🚀 CORREÇÃO: Conectar diretamente ao useAuth
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  
  // Estado global mínimo
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // 🚀 CORREÇÃO: Hooks isolados com validação de usuário
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
  
  // 🚀 CORREÇÃO: Callbacks otimizados para realtime
  const handleContactRefresh = useCallback(() => {
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

  // ✅ CORREÇÃO: Callbacks sem duplicação
  const handleNewMessage = useCallback((message: Message) => {
    // Só processar mensagens externas
    if (!message.fromMe) {
      messages.addOptimisticMessage(message);
    }
  }, [messages]);

  const handleMessageUpdate = useCallback((message: Message) => {
    messages.updateMessage(message);
  }, [messages]);

  // 🚀 CORREÇÃO: Realtime hooks com validação rigorosa
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
      console.warn('[useWhatsAppChat] ⚠️ Usuário não autenticado para marcar como lida');
      return;
    }

    try {
      // 🚀 CORREÇÃO: Validação rigorosa de ownership
      const { error } = await supabase
        .from('leads')
        .update({ unread_count: 0 })
        .eq('id', contactId)
        .eq('created_by_user_id', user.id); // 🚀 CORREÇÃO: Filtro rigoroso
      
      if (error) throw error;
      
      handleContactRefresh();
    } catch (error) {
      console.error('[useWhatsAppChat] ❌ Erro ao marcar como lida:', error);
    }
  }, [user?.id, handleContactRefresh]);

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

  // ✅ CORREÇÃO: Função sendMessage otimizada
  const sendMessage = useCallback(async (text: string, mediaType?: string, mediaUrl?: string): Promise<boolean> => {
    if (!user?.id) {
      console.warn('[useWhatsAppChat] ⚠️ Usuário não autenticado para enviar mensagem');
      return false;
    }

    console.log('[useWhatsAppChat] 📤 Enviando mensagem:', {
      text: text.substring(0, 50) + '...',
      mediaType: mediaType || 'text',
      hasMediaUrl: !!mediaUrl,
      userId: user.id
    });

    return await messages.sendMessage(text, mediaType, mediaUrl);
  }, [messages, user?.id]);

  // 🚀 CORREÇÃO: Saúde com cache stats
  const instanceHealth = useMemo(() => ({
    score: database.healthScore,
    isHealthy: database.isHealthy,
    connectedInstances: database.connectedInstances,
    totalInstances: database.totalInstances
  }), [database.healthScore, database.isHealthy, database.connectedInstances, database.totalInstances]);

  // 🚀 CORREÇÃO: Estatísticas de realtime melhoradas
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

  // 🚀 CORREÇÃO: Notificações de saúde com validação de usuário
  useEffect(() => {
    if (!user?.id) return;
    
    if (database.totalInstances > 0 && database.connectedInstances === 0) {
      const timeoutId = setTimeout(() => {
        toast.error('🚨 Nenhuma instância WhatsApp conectada');
      }, 5000);

      return () => clearTimeout(timeoutId);
    }
  }, [database.totalInstances, database.connectedInstances, user?.id]);

  // Listener para seleção via notificação
  useEffect(() => {
    if (!user?.id) return;
    
    const handleSelectContactEvent = (event: CustomEvent) => {
      const { contactId } = event.detail;
      
      const targetContact = contacts.contacts.find(contact => 
        contact.id === contactId || contact.leadId === contactId
      );
      
      if (targetContact) {
        handleSelectContact(targetContact);
      } else {
        handleContactRefresh();
      }
    };

    window.addEventListener('selectContact', handleSelectContactEvent as EventListener);
    
    return () => {
      window.removeEventListener('selectContact', handleSelectContactEvent as EventListener);
    };
  }, [contacts.contacts, handleSelectContact, handleContactRefresh, user?.id]);

  return {
    // Estados principais
    selectedContact,
    setSelectedContact: handleSelectContact,
    companyLoading: false, // 🚀 CORREÇÃO: Sem dependência de useCompanyData
    
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
