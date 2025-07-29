
/**
 * 🎯 HOOK PRINCIPAL - ARQUITETURA DIRETA SEM PROVIDER
 * 
 * RESPONSABILIDADES:
 * ✅ Orquestrar todos os hooks do WhatsApp
 * ✅ Gerenciar estado global mínimo (contato selecionado)
 * ✅ Expor API unificada para componentes
 * 
 * CORREÇÕES IMPLEMENTADAS:
 * ✅ Integração correta com MessagingService
 * ✅ Parâmetros corretos para envio de mensagens
 * ✅ Suporte completo para mídia
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
import { useCompanyData } from '../useCompanyData';
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
  };
}

export const useWhatsAppChat = (): UseWhatsAppChatReturn => {
  const { user } = useAuth();
  const { userId, loading: companyLoading } = useCompanyData();
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
  
  // Callbacks otimizados para realtime
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

  // Realtime hooks
  const chatsRealtime = useChatsRealtime({
    userId: user?.id || null,
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
    onNewMessage: messages.addOptimisticMessage,
    onMessageUpdate: messages.updateMessage
  });

  // Ações principais
  const markAsRead = useCallback(async (contactId: string) => {
    try {
      await supabase
        .from('leads')
        .update({ unread_count: 0 })
        .eq('id', contactId);
      
      handleContactRefresh();
    } catch (error) {
      console.error('[useWhatsAppChat] ❌ Erro ao marcar como lida:', error);
    }
  }, [handleContactRefresh]);

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

  // 🎯 FUNÇÃO CORRIGIDA: Enviar mensagem com parâmetros corretos
  const sendMessage = useCallback(async (text: string, mediaType?: string, mediaUrl?: string): Promise<boolean> => {
    if (!text.trim()) {
      toast.error('Mensagem não pode estar vazia');
      return false;
    }

    console.log('[useWhatsAppChat] 📤 Enviando mensagem:', {
      text: text.substring(0, 50) + '...',
      mediaType: mediaType || 'text',
      hasMediaUrl: !!mediaUrl
    });

    // Criar objeto de mídia se necessário
    let media: { file: File; type: string } | undefined;
    
    if (mediaType && mediaUrl && mediaType !== 'text') {
      // Converter DataURL de volta para File (para compatibilidade)
      try {
        const response = await fetch(mediaUrl);
        const blob = await response.blob();
        const file = new File([blob], `media.${mediaType}`, { type: blob.type });
        
        media = {
          file,
          type: mediaType
        };
      } catch (error) {
        console.error('[useWhatsAppChat] ❌ Erro ao converter mídia:', error);
      }
    }
    
    return await messages.sendMessage(text, media);
  }, [messages]);

  // Saúde e estatísticas
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
    lastMessagesUpdate: null
  }), [chatsRealtime, messagesRealtime]);

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

  // Notificações de saúde
  useEffect(() => {
    if (database.totalInstances > 0 && database.connectedInstances === 0) {
      const timeoutId = setTimeout(() => {
        toast.error('🚨 Nenhuma instância WhatsApp conectada');
      }, 5000);

      return () => clearTimeout(timeoutId);
    }
  }, [database.totalInstances, database.connectedInstances]);

  // Listener para seleção via notificação
  useEffect(() => {
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
  }, [contacts.contacts, handleSelectContact, handleContactRefresh]);

  return {
    // Estados principais
    selectedContact,
    setSelectedContact: handleSelectContact,
    companyLoading,
    
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
