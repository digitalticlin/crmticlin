
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useWhatsAppInstances } from '@/hooks/whatsapp/useWhatsAppInstances';
import { useWhatsAppContacts } from '@/hooks/whatsapp/useWhatsAppContacts';
import { useWhatsAppChatMessages } from '@/hooks/whatsapp/chat/useWhatsAppChatMessages';
import { useChatsRealtime } from '@/hooks/whatsapp/realtime/useChatsRealtime';
import { toast } from 'sonner';

interface WhatsAppChatContextType {
  // Instances
  instances: WhatsAppWebInstance[];
  activeInstance: WhatsAppWebInstance | null;
  setActiveInstance: (instance: WhatsAppWebInstance | null) => void;
  isLoadingInstances: boolean;
  
  // Contacts
  contacts: Contact[];
  selectedContact: Contact | null;
  setSelectedContact: (contact: Contact | null) => void;
  isLoadingContacts: boolean;
  hasMoreContacts: boolean;
  loadMoreContacts: () => Promise<void>;
  refreshContacts: () => void;
  
  // Messages
  messages: Message[];
  isLoadingMessages: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  isSendingMessage: boolean;
  messagesLoaded: boolean; // ✅ NOVO
  
  // Actions
  sendMessage: (message: string, media?: { file: File; type: string }) => Promise<boolean>;
  loadMoreMessages: () => Promise<void>;
  refreshMessages: () => void;
  loadMessagesOnDemand: () => Promise<void>; // ✅ NOVO
  
  // UI State
  isMobile: boolean;
  showContacts: boolean;
  toggleContacts: () => void;
}

const WhatsAppChatContext = createContext<WhatsAppChatContextType | undefined>(undefined);

export const useWhatsAppChat = () => {
  const context = useContext(WhatsAppChatContext);
  if (!context) {
    throw new Error('useWhatsAppChat must be used within a WhatsAppChatProvider');
  }
  return context;
};

interface WhatsAppChatProviderProps {
  children: React.ReactNode;
  isMobile?: boolean;
}

export const WhatsAppChatProvider: React.FC<WhatsAppChatProviderProps> = ({
  children,
  isMobile = false
}) => {
  const [activeInstance, setActiveInstance] = useState<WhatsAppWebInstance | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContacts, setShowContacts] = useState(!isMobile);

  // ✅ HOOKS OTIMIZADOS
  const { instances, isLoading: isLoadingInstances } = useWhatsAppInstances();
  
  const {
    contacts,
    isLoading: isLoadingContacts,
    hasMoreContacts,
    loadMoreContacts,
    refreshContacts,
    updateContact,
    moveContactToTop
  } = useWhatsAppContacts(activeInstance?.id);

  const {
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    isSendingMessage,
    messagesLoaded, // ✅ NOVO
    sendMessage,
    loadMoreMessages,
    refreshMessages,
    loadMessagesOnDemand // ✅ NOVO
  } = useWhatsAppChatMessages({
    selectedContact,
    activeInstance,
    onContactUpdate: updateContact
  });

  // ✅ REALTIME PARA CHATS (SEMPRE ATIVO)
  useChatsRealtime({
    userId: null,
    activeInstanceId: activeInstance?.id || null,
    onMoveContactToTop: moveContactToTop
  });

  // ✅ CALLBACKS OTIMIZADOS
  const handleSetSelectedContact = useCallback((contact: Contact | null) => {
    console.log('[WhatsApp Chat Provider] 👤 Selecionando contato:', contact?.name);
    setSelectedContact(contact);
    
    // ✅ FECHAR LISTA DE CONTATOS NO MOBILE
    if (isMobile && contact) {
      setShowContacts(false);
    }
  }, [isMobile]);

  const handleSendMessage = useCallback(async (message: string, media?: { file: File; type: string }) => {
    if (!selectedContact || !activeInstance) {
      toast.error('Selecione um contato e instância primeiro');
      return false;
    }

    const success = await sendMessage(message, media);
    
    if (success) {
      // ✅ MOVER CONTATO PARA TOPO APÓS ENVIO
      moveContactToTop(selectedContact.id, {
        text: message,
        timestamp: new Date().toISOString()
      });
    }
    
    return success;
  }, [selectedContact, activeInstance, sendMessage, moveContactToTop]);

  const toggleContacts = useCallback(() => {
    setShowContacts(prev => !prev);
  }, []);

  // ✅ MEMOIZED CONTEXT VALUE
  const contextValue = useMemo(() => ({
    // Instances
    instances,
    activeInstance,
    setActiveInstance,
    isLoadingInstances,
    
    // Contacts
    contacts,
    selectedContact,
    setSelectedContact: handleSetSelectedContact,
    isLoadingContacts,
    hasMoreContacts,
    loadMoreContacts,
    refreshContacts,
    
    // Messages
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    isSendingMessage,
    messagesLoaded, // ✅ NOVO
    
    // Actions
    sendMessage: handleSendMessage,
    loadMoreMessages,
    refreshMessages,
    loadMessagesOnDemand, // ✅ NOVO
    
    // UI State
    isMobile,
    showContacts,
    toggleContacts
  }), [
    instances,
    activeInstance,
    isLoadingInstances,
    contacts,
    selectedContact,
    handleSetSelectedContact,
    isLoadingContacts,
    hasMoreContacts,
    loadMoreContacts,
    refreshContacts,
    messages,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    isSendingMessage,
    messagesLoaded, // ✅ NOVO
    handleSendMessage,
    loadMoreMessages,
    refreshMessages,
    loadMessagesOnDemand, // ✅ NOVO
    isMobile,
    showContacts,
    toggleContacts
  ]);

  return (
    <WhatsAppChatContext.Provider value={contextValue}>
      {children}
    </WhatsAppChatContext.Provider>
  );
};
