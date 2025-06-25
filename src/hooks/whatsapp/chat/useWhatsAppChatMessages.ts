
import { useState, useEffect, useCallback, useRef } from 'react';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { MessageService } from './services/messageService';
import { useMessageRealtime } from './hooks/useMessageRealtime';
import { supabase } from '@/integrations/supabase/client';

export const useWhatsAppChatMessages = (
  selectedContact: Contact | null,
  activeInstance: WhatsAppWebInstance | null
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Refs para evitar loops infinitos
  const selectedContactRef = useRef<Contact | null>(null);
  const activeInstanceRef = useRef<WhatsAppWebInstance | null>(null);
  const isLoadingRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  selectedContactRef.current = selectedContact;
  activeInstanceRef.current = activeInstance;

  // Função estável de fetch com debouncing
  const fetchMessages = useCallback(async (): Promise<void> => {
    const currentContact = selectedContactRef.current;
    const currentInstance = activeInstanceRef.current;
    
    if (!currentContact || !currentInstance || isLoadingRef.current) {
      console.log('[WhatsApp Chat Messages] Skip fetch - missing data or loading');
      return;
    }

    // Debouncing para evitar múltiplas chamadas
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        isLoadingRef.current = true;
        setIsLoadingMessages(true);
        
        console.log('[WhatsApp Chat Messages] Fetching messages for:', {
          contactId: currentContact.id,
          instanceId: currentInstance.id
        });

        const { data: messagesData, error } = await supabase
          .from('messages')
          .select('*')
          .eq('lead_id', currentContact.id)
          .eq('whatsapp_number_id', currentInstance.id)
          .order('timestamp', { ascending: true });

        if (error) {
          console.error('[WhatsApp Chat Messages] Error fetching:', error);
          return;
        }

        const formattedMessages: Message[] = (messagesData || []).map(msg => ({
          id: msg.id,
          text: msg.text || '',
          fromMe: msg.from_me || false,
          timestamp: new Date(msg.timestamp).toISOString(), // Convert to string
          status: msg.status === 'received' ? 'delivered' : msg.status, // Handle 'received' status
          mediaType: msg.media_type || 'text',
          mediaUrl: msg.media_url,
        }));

        setMessages(formattedMessages);
        console.log('[WhatsApp Chat Messages] Messages loaded:', formattedMessages.length);
        
      } catch (error) {
        console.error('[WhatsApp Chat Messages] Exception:', error);
      } finally {
        isLoadingRef.current = false;
        setIsLoadingMessages(false);
      }
    }, 150); // Debounce de 150ms
  }, []); // Sem dependências - função estável

  // Effect para carregar mensagens quando contato ou instância mudarem
  useEffect(() => {
    if (selectedContact && activeInstance) {
      console.log('[WhatsApp Chat Messages] Contact/Instance changed, fetching messages');
      fetchMessages();
    } else {
      setMessages([]);
    }

    // Cleanup do debounce
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [selectedContact?.id, activeInstance?.id, fetchMessages]);

  // Cleanup geral no unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      isLoadingRef.current = false;
    };
  }, []);

  // Send message
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    setIsSending(true);
    try {
      const success = await MessageService.sendMessage(selectedContact, activeInstance, text);
      if (success) {
        setTimeout(() => fetchMessages(), 500);
      }
      return success;
    } catch (error) {
      console.error('[WhatsApp Chat Messages FASE 3] ❌ Error sending message:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [selectedContact, activeInstance, fetchMessages]);

  // Setup realtime subscription
  useMessageRealtime({
    selectedContact,
    activeInstance,
    onMessageUpdate: fetchMessages
  });

  return {
    messages,
    isLoadingMessages,
    isSending,
    fetchMessages,
    sendMessage,
    setMessages
  };
};
