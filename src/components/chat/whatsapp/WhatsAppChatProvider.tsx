
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Contact, Message } from '@/types/chat';
import { WhatsAppConnectionStatus } from '@/types/whatsapp';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useWhatsAppDatabase } from '@/hooks/whatsapp/useWhatsAppDatabase';
import { useWhatsAppContacts } from '@/hooks/whatsapp/useWhatsAppContacts';
import { useWhatsAppChatMessages } from '@/hooks/whatsapp/chat/useWhatsAppChatMessages';
import { useRealtimeLeads } from '@/hooks/chat/useRealtimeLeads';
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
  
  // 🚀 ESTATÍSTICAS DO SISTEMA MODULAR DE REALTIME
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
  // 🚨 DEBUG: Simples
  if (process.env.NODE_ENV === 'development') {
    console.log('🚨 [PROVIDER] WhatsAppChatProvider renderizado:', new Date().toISOString());
  }
  
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

  // Conversão para compatibilidade
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

  // 🚀 SEMPRE: Hook de contatos (50 contatos)
  const contactsHook = useWhatsAppContacts(webActiveInstance?.id);
  
  // 🚀 SEMPRE: Hook de mensagens (mas só carrega quando selectedContact existe)
  const messagesHook = useWhatsAppChatMessages(selectedContact, webActiveInstance);
  
  // 🚀 SEMPRE: Hooks de realtime (mas só ativam quando necessário)
  const chatsRealtimeStats = useChatsRealtime({
    userId: user?.id || null,
    activeInstanceId: webActiveInstance?.id || null,
    onContactUpdate: useCallback((contactId: string) => {
      // Fallback legado - não deveria ser usado se callbacks granulares existem
      console.log('[Provider] 🔄 Fallback: refresh completo por onContactUpdate');
      contactsHook.refreshContacts();
    }, []),
    onNewContact: useCallback(() => {
      // Fallback legado - não deveria ser usado se callbacks granulares existem
      console.log('[Provider] 🔄 Fallback: refresh completo por onNewContact');
    }, []),
    onContactsRefresh: useCallback(() => {
      // Fallback para casos extremos onde callbacks granulares falharam
      console.log('[Provider] 🔄 Fallback: refresh completo forçado');
      contactsHook.refreshContacts();
    }, []),
    // 🚀 NOVAS CALLBACKS GRANULARES - PRIORIDADE MÁXIMA
    onMoveContactToTop: useCallback((contactId: string, newMessage) => {
      console.log('[Provider] 🔝 Movendo contato para topo:', { contactId, newMessage });
      contactsHook.moveContactToTop(contactId, newMessage);
    }, []),
    onUpdateUnreadCount: useCallback((contactId: string, increment = true) => {
      console.log('[Provider] 🔢 Atualizando contador:', { contactId, increment });
      contactsHook.updateUnreadCount(contactId, increment);
    }, []),
    onAddNewContact: useCallback((newContactData) => {
      console.log('[Provider] ➕ Adicionando novo contato:', newContactData);
      contactsHook.addNewContact(newContactData);
    }, [])
  });

  // Funções auxiliares
  const moveContactToTop = useCallback((contactId: string) => {
    contactsHook.refreshContacts();
  }, []);

  const markAsRead = useCallback(async (contactId: string) => {
    try {
      await supabase
        .from('leads')
        .update({ unread_count: 0 })
        .eq('id', contactId);
      
      contactsHook.refreshContacts();
    } catch (error) {
      console.error('[WhatsApp Chat] ❌ Erro ao marcar como lida:', error);
    }
  }, []);

  // Seleção de contato
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

  // Saúde da instância
  const instanceHealth = useMemo(() => ({
    score: healthScore,
    isHealthy,
    connectedInstances,
    totalInstances
  }), [healthScore, isHealthy, connectedInstances, totalInstances]);

  // Estatísticas do realtime
  const realtimeStats = useMemo(() => ({
    chatsConnected: chatsRealtimeStats.isConnected,
    messagesConnected: false, // Messages realtime is handled internally by useWhatsAppChatMessages
    totalChatsEvents: chatsRealtimeStats.totalEvents,
    totalMessagesEvents: 0, // Messages events are handled internally
    lastChatsUpdate: chatsRealtimeStats.lastUpdate,
    lastMessagesUpdate: null // Messages updates are handled internally
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

  // Notificação de saúde
  useEffect(() => {
    if (totalInstances > 0 && connectedInstances === 0) {
      const timeoutId = setTimeout(() => {
        toast.error('🚨 Nenhuma instância WhatsApp conectada');
      }, 5000);

      return () => clearTimeout(timeoutId);
    }
  }, [totalInstances, connectedInstances]);

  // Valor do contexto
  const value = useMemo((): WhatsAppChatContextType => ({
    // Contatos (sempre carregados)
    contacts: contactsHook.contacts,
    isLoadingContacts: contactsHook.isLoading,
    isLoadingMoreContacts: contactsHook.isLoadingMore,
    hasMoreContacts: contactsHook.hasMoreContacts,
    loadMoreContacts: contactsHook.loadMoreContacts,
    moveContactToTop,
    markAsRead,
    totalContactsAvailable: contactsHook.totalContactsAvailable,
    
    // Mensagens (carregadas apenas quando há contato selecionado)
    messages: messagesHook.messages,
    isLoadingMessages: messagesHook.isLoadingMessages,
    isLoadingMore: messagesHook.isLoadingMore,
    hasMoreMessages: messagesHook.hasMoreMessages,
    isSending: messagesHook.isSending,
    sendMessage: messagesHook.sendMessage,
    loadMoreMessages: messagesHook.loadMoreMessages,
    
    // Seleção
    selectedContact,
    setSelectedContact: handleSelectContact,
    
    // Refresh
    fetchContacts: contactsHook.refreshContacts,
    fetchMessages: messagesHook.fetchMessages,
    
    // Estado geral
    companyLoading,
    instanceHealth,
    realtimeStats
  }), [
    // 🚀 DEPENDÊNCIAS MÍNIMAS: Apenas valores primitivos e IDs
    contactsHook.contacts.length,
    contactsHook.isLoading,
    contactsHook.isLoadingMore,
    contactsHook.hasMoreContacts,
    contactsHook.totalContactsAvailable,
    messagesHook.messages.length,
    messagesHook.isLoadingMessages,
    messagesHook.isLoadingMore,
    messagesHook.hasMoreMessages,
    messagesHook.isSending,
    selectedContact?.id,
    companyLoading,
    instanceHealth.score,
    realtimeStats.chatsConnected,
    realtimeStats.messagesConnected
  ]);

  return (
    <WhatsAppChatContext.Provider value={value}>
      {children}
    </WhatsAppChatContext.Provider>
  );
});

WhatsAppChatProvider.displayName = 'WhatsAppChatProvider';
