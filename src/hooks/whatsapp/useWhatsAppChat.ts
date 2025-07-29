import { useState, useEffect, useCallback, useRef } from 'react';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useContacts } from './useContacts';
import { useWhatsAppInstances } from './useWhatsAppInstances';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useWhatsAppChatMessages } from './chat/useWhatsAppChatMessages';
import { useMessagesRealtime } from './realtime/useMessagesRealtime';

export const useWhatsAppChat = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [activeInstance, setActiveInstance] = useState<WhatsAppWebInstance | null>(null);
  const { contacts, isLoading: isLoadingContacts } = useContacts();
  const { instances, isLoading: isLoadingInstances } = useWhatsAppInstances();
  const { user } = useAuth();

  const lastSelectedContact = useRef<Contact | null>(null);
  const lastActiveInstance = useRef<WhatsAppWebInstance | null>(null);

  const {
    messages,
    isLoading: isLoadingMessages,
    isSending,
    hasMoreMessages,
    isLoadingMore,
    sendMessage,
    loadMore,
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
      name: instance.name,
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

  const loadMore = useCallback(async () => {
    if (isLoadingMessages || isLoadingMore || !hasMoreMessages) {
      return;
    }

    if (!selectedContact || !activeInstance) {
      console.warn('[useWhatsAppChat] Carregar mais mensagens sem contato/instância');
      return;
    }

    console.log('[useWhatsAppChat] ⬇️ Carregando mais mensagens...');
    await loadMore();
  }, [isLoadingMessages, isLoadingMore, hasMoreMessages, selectedContact, activeInstance, loadMore]);

  return {
    // Contatos e instâncias
    contacts,
    instances,
    selectedContact,
    activeInstance,
    
    // Estados de carregamento
    isLoading: isLoadingContacts || isLoadingInstances,
    isLoadingMessages,
    isSending,
    hasMoreMessages,
    isLoadingMore,
    isRealtimeConnected,
    
    // Mensagens
    messages,
    
    // Ações
    selectContact,
    selectInstance,
    sendMessage: handleSendMessage,
    loadMoreMessages: loadMore
  };
};
