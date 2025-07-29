
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Contact, Message } from '@/types/chat';
import { WhatsAppConnectionStatus } from '@/types/whatsapp';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useWhatsAppDatabase } from '@/hooks/whatsapp/useWhatsAppDatabase';
import { useWhatsAppContacts } from '@/hooks/whatsapp/useWhatsAppContacts';
import { useWhatsAppChatMessages } from '@/hooks/whatsapp/chat/useWhatsAppChatMessages';
import { useChatsRealtime } from '@/hooks/whatsapp/realtime';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppChatContextType {
  // Contatos com paginação
  contacts: Contact[];
  isLoadingContacts: boolean;
  isLoadingMoreContacts: boolean;
  hasMoreContacts: boolean;
  loadMoreContacts: () => Promise<void>;
  moveContactToTop: (contactId: string) => void;
  markAsRead: (contactId: string) => void;
  totalContactsAvailable: number;
  
  // Mensagens com paginação
  messages: Message[];
  isLoadingMessages: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  isSending: boolean;
  sendMessage: (text: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
  loadMoreMessages: () => Promise<void>;
  
  // Contato selecionado
  selectedContact: Contact | null;
  setSelectedContact: (contact: Contact | null) => void;
  
  // Refresh manual
  fetchContacts: () => void;
  fetchMessages: () => void;
  
  // Estado geral
  companyLoading: boolean;
  instanceHealth: {
    score: number;
    isHealthy: boolean;
    connectedInstances: number;
    totalInstances: number;
  };
  
  // Estatísticas do sistema modular de realtime
  realtimeStats: {
    chatsConnected: boolean;
    messagesConnected: boolean;
    totalChatsEvents: number;
    totalMessagesEvents: number;
    lastChatsUpdate: number | null;
    lastMessagesUpdate: number | null;
  };
}

const WhatsAppChatContext = createContext<WhatsAppChatContextType | null>(null);

export const useWhatsAppChatContext = () => {
  const context = useContext(WhatsAppChatContext);
  if (!context) {
    throw new Error("useWhatsAppChatContext must be used within WhatsAppChatProvider");
  }
  return context;
};

export const WhatsAppChatProvider = React.memo(({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { userId, loading: companyLoading } = useCompanyData();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  
  // Estado do contato selecionado
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Sistema de banco de dados
  const { 
    instances, 
    getActiveInstance, 
    healthScore, 
    isHealthy,
    totalInstances,
    connectedInstances
  } = useWhatsAppDatabase();
  
  // Instância ativa memoizada
  const activeInstance = useMemo(() => getActiveInstance(), [instances]);

  // Conversão para compatibilidade memoizada
  const webActiveInstance = useMemo(() => {
    if (!activeInstance) return null;
    
    return {
      id: activeInstance.id,
      instance_name: activeInstance.instance_name,
      connection_type: activeInstance.connection_type || 'web',
      server_url: activeInstance.server_url || '',
      vps_instance_id: activeInstance.vps_instance_id || '',
      web_status: activeInstance.web_status || '',
      connection_status: (activeInstance.connection_status || 'disconnected') as WhatsAppConnectionStatus,
      qr_code: activeInstance.qr_code,
      phone: activeInstance.phone,
      profile_name: activeInstance.profile_name,
      profile_pic_url: activeInstance.profile_pic_url,
      date_connected: activeInstance.date_connected,
      date_disconnected: activeInstance.date_disconnected,
      created_by_user_id: activeInstance.created_by_user_id || '',
      created_at: activeInstance.created_at || new Date().toISOString(),
      updated_at: activeInstance.updated_at || new Date().toISOString(),
      history_imported: false
    };
  }, [activeInstance]);

  // Hook de contatos
  const contactsHook = useWhatsAppContacts(webActiveInstance?.id);
  
  // Callbacks memoizados para realtime
  const handleMoveContactToTop = useCallback((contactId: string, newMessage?: any) => {
    contactsHook.moveContactToTop(contactId, newMessage);
  }, [contactsHook.moveContactToTop]);

  const handleUpdateUnreadCount = useCallback((contactId: string, increment = true) => {
    contactsHook.updateUnreadCount(contactId, increment);
  }, [contactsHook.updateUnreadCount]);

  const handleAddNewContact = useCallback((newContactData: any) => {
    contactsHook.addNewContact(newContactData);
  }, [contactsHook.addNewContact]);

  const handleContactRefresh = useCallback(() => {
    contactsHook.refreshContacts();
  }, [contactsHook.refreshContacts]);

  // Hook de mensagens
  const messagesHook = useWhatsAppChatMessages({
    selectedContact,
    activeInstance: webActiveInstance
  });
  
  // Hooks de realtime com callbacks memoizados
  const chatsRealtimeStats = useChatsRealtime({
    userId: user?.id || null,
    activeInstanceId: webActiveInstance?.id || null,
    onContactUpdate: handleContactRefresh,
    onNewContact: handleContactRefresh,
    onContactsRefresh: handleContactRefresh,
    onMoveContactToTop: handleMoveContactToTop,
    onUpdateUnreadCount: handleUpdateUnreadCount,
    onAddNewContact: handleAddNewContact
  });

  // Funções auxiliares memoizadas
  const moveContactToTop = useCallback((contactId: string, newMessage?: any) => {
    handleMoveContactToTop(contactId, newMessage);
  }, [handleMoveContactToTop]);

  const markAsRead = useCallback(async (contactId: string) => {
    try {
      await supabase
        .from('leads')
        .update({ unread_count: 0 })
        .eq('id', contactId);
      
      handleContactRefresh();
    } catch (error) {
      console.error('[WhatsApp Chat] ❌ Erro ao marcar como lida:', error);
    }
  }, [handleContactRefresh]);

  // Seleção de contato memoizada
  const handleSelectContact = useCallback(async (contact: Contact | null) => {
    if (contact && contact.unreadCount && contact.unreadCount > 0) {
      try {
        await markAsRead(contact.id);
      } catch (error) {
        console.error('[WhatsApp Chat Provider] ❌ Erro ao marcar como lida:', error);
      }
    }
    
    setSelectedContact(contact);
  }, [markAsRead]);

  // Wrapper para sendMessage memoizado
  const sendMessageWrapper = useCallback(async (text: string, mediaType?: string, mediaUrl?: string): Promise<boolean> => {
    if (!text.trim()) return false;
    
    const media = mediaType && mediaUrl ? {
      file: new File([], mediaUrl.split('/').pop() || 'file'),
      type: mediaType
    } : undefined;
    
    return await messagesHook.sendMessage(text, media);
  }, [messagesHook.sendMessage]);

  // Saúde da instância memoizada
  const instanceHealth = useMemo(() => ({
    score: healthScore,
    isHealthy,
    connectedInstances,
    totalInstances
  }), [healthScore, isHealthy, connectedInstances, totalInstances]);

  // Estatísticas do realtime memoizadas
  const realtimeStats = useMemo(() => ({
    chatsConnected: chatsRealtimeStats.isConnected,
    messagesConnected: false,
    totalChatsEvents: chatsRealtimeStats.totalEvents,
    totalMessagesEvents: 0,
    lastChatsUpdate: chatsRealtimeStats.lastUpdate,
    lastMessagesUpdate: null
  }), [
    chatsRealtimeStats.isConnected,
    chatsRealtimeStats.totalEvents,
    chatsRealtimeStats.lastUpdate
  ]);

  // Auto-seleção de contato da URL
  useEffect(() => {
    if (leadId && contactsHook.contacts.length > 0 && !selectedContact && !hasInitialized) {
      const targetContact = contactsHook.contacts.find(contact => contact.id === leadId);
      if (targetContact) {
        handleSelectContact(targetContact);
      }
      setHasInitialized(true);
    }
  }, [leadId, contactsHook.contacts, selectedContact, hasInitialized, handleSelectContact]);

  // Notificação de saúde (apenas se necessário)
  useEffect(() => {
    if (totalInstances > 0 && connectedInstances === 0) {
      const timeoutId = setTimeout(() => {
        toast.error('🚨 Nenhuma instância WhatsApp conectada');
      }, 5000);

      return () => clearTimeout(timeoutId);
    }
  }, [totalInstances, connectedInstances]);

  // Listener para seleção de contato via notificação
  useEffect(() => {
    const handleSelectContactEvent = (event: CustomEvent) => {
      const { contactId } = event.detail;
      
      const targetContact = contactsHook.contacts.find(contact => 
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
  }, [contactsHook.contacts, handleSelectContact, handleContactRefresh]);

  // Valor do contexto otimizado
  const value = useMemo((): WhatsAppChatContextType => ({
    contacts: contactsHook.contacts,
    isLoadingContacts: contactsHook.isLoading,
    isLoadingMoreContacts: contactsHook.isLoadingMore,
    hasMoreContacts: contactsHook.hasMoreContacts,
    loadMoreContacts: contactsHook.loadMoreContacts,
    moveContactToTop,
    markAsRead,
    totalContactsAvailable: contactsHook.totalContactsAvailable,
    
    messages: messagesHook.messages,
    isLoadingMessages: messagesHook.isLoadingMessages,
    isLoadingMore: messagesHook.isLoadingMore,
    hasMoreMessages: messagesHook.hasMoreMessages,
    isSending: messagesHook.isSendingMessage,
    sendMessage: sendMessageWrapper,
    loadMoreMessages: messagesHook.loadMoreMessages,
    
    selectedContact,
    setSelectedContact: handleSelectContact,
    
    fetchContacts: handleContactRefresh,
    fetchMessages: messagesHook.refreshMessages,
    
    companyLoading,
    instanceHealth,
    realtimeStats
  }), [
    contactsHook.contacts,
    contactsHook.isLoading,
    contactsHook.isLoadingMore,
    contactsHook.hasMoreContacts,
    contactsHook.loadMoreContacts,
    contactsHook.totalContactsAvailable,
    messagesHook.messages,
    messagesHook.isLoadingMessages,
    messagesHook.isLoadingMore,
    messagesHook.hasMoreMessages,
    messagesHook.isSendingMessage,
    messagesHook.loadMoreMessages,
    messagesHook.refreshMessages,
    selectedContact,
    companyLoading,
    instanceHealth,
    realtimeStats,
    moveContactToTop,
    markAsRead,
    sendMessageWrapper,
    handleSelectContact,
    handleContactRefresh
  ]);

  return (
    <WhatsAppChatContext.Provider value={value}>
      {children}
    </WhatsAppChatContext.Provider>
  );
});

WhatsAppChatProvider.displayName = 'WhatsAppChatProvider';
