
import { useState, useCallback, useEffect } from 'react';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { MessageService } from './services/messageService';
import { useMessageRealtime } from './hooks/useMessageRealtime';

export const useWhatsAppChatMessages = (
  selectedContact: Contact | null,
  activeInstance: WhatsAppWebInstance | null
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch messages for selected contact
  const fetchMessages = useCallback(async () => {
    if (!selectedContact || !activeInstance) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    try {
      const chatMessages = await MessageService.fetchMessages(selectedContact, activeInstance);
      setMessages(chatMessages);
    } catch (error) {
      console.error('[WhatsApp Chat Messages FASE 3] ❌ Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedContact, activeInstance]);

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

  // Fetch messages when dependencies change
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    isLoadingMessages,
    isSending,
    fetchMessages,
    sendMessage
  };
};
