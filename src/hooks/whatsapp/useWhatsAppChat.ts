
import { useState, useEffect, useCallback, useRef } from 'react';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useAuth } from '@/contexts/AuthContext';
import { useWhatsAppChatMessages } from './chat/useWhatsAppChatMessages';
import { useMessagesRealtime } from './realtime/useMessagesRealtime';
import { useWhatsAppWebInstances } from './useWhatsAppWebInstances';
import { toast } from 'sonner';

export const useWhatsAppChat = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [activeInstance, setActiveInstance] = useState<WhatsAppWebInstance | null>(null);
  const { user } = useAuth();

  // Usar hooks reais em vez de mock data
  const { instances, isLoading: isLoadingInstances } = useWhatsAppWebInstances();
  
  // Mock data temporário para contatos - será substituído por hook real posteriormente
  const [contacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'Contato Teste',
      phone: '+5511999999999',
      lastMessage: 'Olá! Como posso ajudar?',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0
    }
  ]);
  const [isLoadingContacts] = useState(false);

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

  // Definir instância ativa automaticamente
  useEffect(() => {
    if (instances.length > 0 && !activeInstance) {
      const connectedInstance = instances.find(
        instance => instance.connection_status === 'connected' || instance.connection_status === 'ready'
      );
      if (connectedInstance) {
        setActiveInstance(connectedInstance);
        console.log('[useWhatsAppChat] ⚙️ Instância ativa definida automaticamente:', {
          instance_name: connectedInstance.instance_name,
          phone: connectedInstance.phone
        });
      }
    }
  }, [instances, activeInstance]);

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
    if (!message.trim() && !mediaUrl) {
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

  // Funções de compatibilidade
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
