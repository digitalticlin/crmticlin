import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Contact, Message } from '@/types/chat';
import { WhatsAppConnectionStatus } from '@/types/whatsapp';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useWhatsAppDatabase } from '@/hooks/whatsapp/useWhatsAppDatabase';
import { useWhatsAppContacts } from '@/hooks/whatsapp/useWhatsAppContacts';
import { useWhatsAppChatMessages } from '@/hooks/whatsapp/chat/useWhatsAppChatMessages';
import { useContactsRealtime } from '@/hooks/whatsapp/contacts/useContactsRealtime';
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
    contactsConnected: boolean;
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

  // ✅ SEMPRE: Hook de contatos
  const contactsHook = useWhatsAppContacts(webActiveInstance?.id);
  
  // ✅ CALLBACK PARA ATUALIZAR CONTATOS
  const handleContactUpdate = useCallback((contactId: string, updates: Partial<Contact>) => {
    console.log('[Provider] 🔄 Atualizando contato:', { contactId, updates });
    contactsHook.updateContact(contactId, updates);
  }, [contactsHook]);

  // ✅ CALLBACK PARA MOVER CONTATO PARA TOPO
  const handleMoveContactToTop = useCallback((contactId: string) => {
    console.log('[Provider] 🔝 Movendo contato para topo:', { contactId });
    contactsHook.moveContactToTop(contactId);
  }, [contactsHook]);

  // ✅ CALLBACK PARA QUANDO NOVA MENSAGEM É ENVIADA/RECEBIDA
  const handleContactUpdateFromMessage = useCallback((contactId: string, lastMessage: string, timestamp: string) => {
    console.log('[Provider] 📨 Atualizando contato via mensagem:', { contactId, lastMessage, timestamp });
    
    // Atualizar dados do contato
    handleContactUpdate(contactId, {
      lastMessage,
      lastMessageTime: timestamp
    });
    
    // Mover para topo se não for o contato atual
    if (selectedContact?.id !== contactId) {
      handleMoveContactToTop(contactId);
    }
  }, [selectedContact, handleContactUpdate, handleMoveContactToTop]);

  // ✅ HOOK DE MENSAGENS COM ESTATÍSTICAS
  const messagesHook = useWhatsAppChatMessages({
    selectedContact,
    activeInstance: webActiveInstance,
    onContactUpdate: handleContactUpdateFromMessage
  });

  // ✅ REALTIME DE CONTATOS
  const contactsRealtimeStats = useContactsRealtime({
    userId: user?.id || null,
    activeInstanceId: webActiveInstance?.id || null,
    onContactUpdate: handleContactUpdate,
    onMoveToTop: handleMoveContactToTop,
    enabled: true
  });
  
  // ✅ REALTIME DE CHATS (FALLBACK)
  const chatsRealtimeStats = useChatsRealtime({
    userId: user?.id || null,
    activeInstanceId: webActiveInstance?.id || null,
    onContactsRefresh: useCallback(() => {
      console.log('[Provider] 🔄 Fallback: refresh completo de contatos');
      contactsHook.refreshContacts();
    }, [contactsHook])
  });

  // Funções auxiliares
  const moveContactToTop = useCallback((contactId: string, newMessage?: any) => {
    handleMoveContactToTop(contactId);
  }, [handleMoveContactToTop]);

  const markAsRead = useCallback(async (contactId: string) => {
    try {
      await supabase
        .from('leads')
        .update({ unread_count: 0 })
        .eq('id', contactId);
      
      // Atualizar localmente
      handleContactUpdate(contactId, { unreadCount: 0 });
    } catch (error) {
      console.error('[WhatsApp Chat] ❌ Erro ao marcar como lida:', error);
    }
  }, [handleContactUpdate]);

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

  // ✅ WRAPPER PARA SENDMESSAGE COM LOGS
  const sendMessageWrapper = useCallback(async (text: string, mediaType?: string, mediaUrl?: string): Promise<boolean> => {
    if (!text.trim()) return false;
    
    console.log('[Provider] 📤 Enviando mensagem wrapper:', {
      textLength: text.length,
      mediaType: mediaType || 'text',
      hasMediaUrl: !!mediaUrl
    });
    
    return await messagesHook.sendMessage(text, mediaType, mediaUrl);
  }, [messagesHook.sendMessage]);

  // Saúde da instância
  const instanceHealth = useMemo(() => ({
    score: healthScore,
    isHealthy,
    connectedInstances,
    totalInstances
  }), [healthScore, isHealthy, connectedInstances, totalInstances]);

  // ✅ ESTATÍSTICAS COMPLETAS DO REALTIME
  const realtimeStats = useMemo(() => ({
    chatsConnected: chatsRealtimeStats.isConnected,
    messagesConnected: messagesHook.realtimeStats?.isConnected || false,
    contactsConnected: contactsRealtimeStats.isConnected,
    totalChatsEvents: chatsRealtimeStats.totalEvents,
    totalMessagesEvents: 0,
    lastChatsUpdate: chatsRealtimeStats.lastUpdate,
    lastMessagesUpdate: null,
    // ✅ NOVAS ESTATÍSTICAS
    messagesConnectionAttempts: messagesHook.realtimeStats?.connectionAttempts || 0,
    messagesMaxAttempts: messagesHook.realtimeStats?.maxAttempts || 3
  }), [
    chatsRealtimeStats.isConnected,
    chatsRealtimeStats.totalEvents,
    chatsRealtimeStats.lastUpdate,
    contactsRealtimeStats.isConnected,
    messagesHook.realtimeStats?.isConnected,
    messagesHook.realtimeStats?.connectionAttempts,
    messagesHook.realtimeStats?.maxAttempts
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

  // 🔔 LISTENER PARA SELEÇÃO DE CONTATO VIA NOTIFICAÇÃO
  useEffect(() => {
    const handleSelectContactEvent = (event: CustomEvent) => {
      const { contactId } = event.detail;
      
      const targetContact = contactsHook.contacts.find(contact => 
        contact.id === contactId || contact.leadId === contactId
      );
      
      if (targetContact) {
        console.log('[WhatsApp Provider] 🎯 Selecionando contato via evento:', targetContact.name);
        handleSelectContact(targetContact);
      } else {
        console.warn('[WhatsApp Provider] ⚠️ Contato não encontrado para seleção:', contactId);
        contactsHook.refreshContacts();
      }
    };

    window.addEventListener('selectContact', handleSelectContactEvent as EventListener);
    
    return () => {
      window.removeEventListener('selectContact', handleSelectContactEvent as EventListener);
    };
  }, [contactsHook.contacts, handleSelectContact, contactsHook.refreshContacts]);

  // Valor do contexto
  const value = useMemo((): WhatsAppChatContextType => ({
    // Contatos
    contacts: contactsHook.contacts,
    isLoadingContacts: contactsHook.isLoading,
    isLoadingMoreContacts: contactsHook.isLoadingMore,
    hasMoreContacts: contactsHook.hasMoreContacts,
    loadMoreContacts: contactsHook.loadMoreContacts,
    moveContactToTop,
    markAsRead,
    totalContactsAvailable: contactsHook.totalContactsAvailable,
    
    // Mensagens
    messages: messagesHook.messages,
    isLoadingMessages: messagesHook.isLoadingMessages,
    isLoadingMore: messagesHook.isLoadingMore,
    hasMoreMessages: messagesHook.hasMoreMessages,
    isSending: messagesHook.isSendingMessage,
    sendMessage: sendMessageWrapper,
    loadMoreMessages: messagesHook.loadMoreMessages,
    
    // Seleção
    selectedContact,
    setSelectedContact: handleSelectContact,
    
    // Refresh
    fetchContacts: contactsHook.refreshContacts,
    fetchMessages: messagesHook.refreshMessages,
    
    // Estado geral
    companyLoading,
    instanceHealth,
    realtimeStats: {
      ...realtimeStats,
      messagesRealtimeStats: messagesHook.realtimeStats
    }
  }), [
    contactsHook.contacts.length,
    contactsHook.isLoading,
    contactsHook.isLoadingMore,
    contactsHook.hasMoreContacts,
    contactsHook.totalContactsAvailable,
    messagesHook.messages.length,
    messagesHook.isLoadingMessages,
    messagesHook.isLoadingMore,
    messagesHook.hasMoreMessages,
    messagesHook.isSendingMessage,
    selectedContact?.id,
    companyLoading,
    instanceHealth.score,
    realtimeStats.chatsConnected,
    realtimeStats.messagesConnected,
    realtimeStats.contactsConnected,
    sendMessageWrapper,
    messagesHook.refreshMessages,
    contactsHook.refreshContacts,
    messagesHook.realtimeStats
  ]);

  return (
    <WhatsAppChatContext.Provider value={value}>
      {children}
    </WhatsAppChatContext.Provider>
  );
});

WhatsAppChatProvider.displayName = 'WhatsAppChatProvider';
