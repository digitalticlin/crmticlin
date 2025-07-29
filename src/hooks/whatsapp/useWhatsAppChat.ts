
import { useState, useEffect, useCallback, useRef } from 'react';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useAuth } from '@/contexts/AuthContext';
import { useWhatsAppChatMessages } from './chat/useWhatsAppChatMessages';
import { useMessagesRealtime } from './realtime/useMessagesRealtime';
import { toast } from 'sonner';

export const useWhatsAppChat = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [activeInstance, setActiveInstance] = useState<WhatsAppWebInstance | null>(null);
  const { user } = useAuth();

  // Mock data para contacts e instances - substituir pelos hooks reais quando disponíveis
  const [contacts] = useState<Contact[]>([]);
  const [instances] = useState<WhatsAppWebInstance[]>([]);
  const [isLoadingContacts] = useState(false);
  const [isLoadingInstances] = useState(false);

  const lastSelectedContact = useRef<Contact | null>(null);
  const lastActiveInstance = useRef<WhatsAppWebInstance | null>(null);

  const {
    messages,
    isLoading: isLoadingMessages,
    isSending,
    hasMoreMessages,
    isLoadingMore: isLoadingMoreMessages,
    sendMessage,
    loadMore: loadMoreMessages,
    onNewMessage,
    onMessageUpdate
  } = useWhatsAppChatMessages({
    selectedContact,
    activeInstance
  });

  const { isConnected: isRealtimeConnected } = useMessagesRealtime({
    selectedContact,
    activeInstance,
    onNewMessage,
    onMessageUpdate
  });

  const selectContact = useCallback((contact: Contact) => {
    console.log('[useWhatsAppChat] 👤 Contato selecionado:', {
      name: contact.name,
      phone: contact.phone
    });
    setSelectedContact(contact);
    lastSelectedContact.current = contact;
  }, []);

  const selectInstance = useCallback((instance: WhatsAppWebInstance) => {
    console.log('[useWhatsAppChat] ⚙️ Instância selecionada:', {
      instance_name: instance.instance_name,
      phone: instance.phone
    });
    setActiveInstance(instance);
    lastActiveInstance.current = instance;
  }, []);

  const handleSendMessage = useCallback(async (
    message: string, 
    mediaType?: string, 
    mediaUrl?: string
  ): Promise<boolean> => {
    if (!message.trim()) {
      console.warn('[useWhatsAppChat] Tentativa de envio de mensagem vazia');
      return false;
    }

    if (!selectedContact) {
      toast.error('Nenhum contato selecionado');
      return false;
    }

    if (!activeInstance) {
      toast.error('Nenhuma instância ativa');
      return false;
    }

    console.log('[useWhatsAppChat] 📤 Enviando mensagem:', {
      contactId: selectedContact.id,
      instanceId: activeInstance.id,
      messageLength: message.length,
      mediaType: mediaType || 'text',
      hasMedia: !!mediaUrl
    });

    try {
      const success = await sendMessage(message, mediaType, mediaUrl);
      
      if (success && !mediaType) {
        toast.success('Mensagem enviada');
      }
      
      return success;
    } catch (error: any) {
      console.error('[useWhatsAppChat] Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
      return false;
    }
  }, [selectedContact, activeInstance, sendMessage]);

  const handleLoadMoreMessages = useCallback(async () => {
    if (isLoadingMessages || isLoadingMoreMessages || !hasMoreMessages) {
      return;
    }

    if (!selectedContact || !activeInstance) {
      console.warn('[useWhatsAppChat] Carregar mais mensagens sem contato/instância');
      return;
    }

    console.log('[useWhatsAppChat] ⬇️ Carregando mais mensagens...');
    await loadMoreMessages();
  }, [isLoadingMessages, isLoadingMoreMessages, hasMoreMessages, selectedContact, activeInstance, loadMoreMessages]);

  // Mock functions para compatibilidade
  const refreshMessages = useCallback(async () => {
    console.log('[useWhatsAppChat] 🔄 Refresh messages');
    // Implementar quando necessário
  }, []);

  const refreshContacts = useCallback(async () => {
    console.log('[useWhatsAppChat] 🔄 Refresh contacts');
    // Implementar quando necessário
  }, []);

  const loadMoreContacts = useCallback(async () => {
    console.log('[useWhatsAppChat] ⬇️ Load more contacts');
    // Implementar quando necessário
  }, []);

  return {
    // Contatos e instâncias
    contacts,
    instances,
    selectedContact,
    activeInstance,
    
    // Estados de carregamento
    isLoading: isLoadingContacts || isLoadingInstances,
    isLoadingContacts,
    isLoadingInstances,
    isLoadingMessages,
    isSending,
    isSendingMessage: isSending, // Alias para compatibilidade
    hasMoreMessages,
    isLoadingMore: isLoadingMoreMessages,
    isLoadingMoreMessages,
    isLoadingMoreContacts: false,
    hasMoreContacts: false,
    totalContactsAvailable: contacts.length,
    isRealtimeConnected,
    
    // Mensagens
    messages,
    
    // Ações
    selectContact,
    setSelectedContact: selectContact, // Alias para compatibilidade
    selectInstance,
    sendMessage: handleSendMessage,
    loadMoreMessages: handleLoadMoreMessages,
    loadMoreContacts,
    refreshMessages,
    refreshContacts
  };
};
