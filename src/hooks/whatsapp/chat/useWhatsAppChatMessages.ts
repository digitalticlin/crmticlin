
// FASE 3: Hook otimizado para mensagens do chat WhatsApp
import { useState, useEffect, useCallback } from 'react';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '../useWhatsAppWebInstances';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";

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
      console.log('[WhatsApp Chat Messages FASE 3] 📥 Fetching messages:', {
        leadId: selectedContact.id,
        instanceId: activeInstance.id
      });

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', selectedContact.id)
        .eq('whatsapp_number_id', activeInstance.id)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Convert to Message format
      const chatMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        text: msg.text || '',
        fromMe: msg.from_me,
        timestamp: msg.timestamp,
        status: msg.status || 'sent',
        mediaType: msg.media_type || 'text',
        mediaUrl: msg.media_url,
        // Compatibility fields for UI
        sender: msg.from_me ? 'user' : 'contact',
        time: new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isIncoming: !msg.from_me
      }));

      console.log('[WhatsApp Chat Messages FASE 3] ✅ Messages loaded:', chatMessages.length);
      setMessages(chatMessages);
    } catch (error) {
      console.error('[WhatsApp Chat Messages FASE 3] ❌ Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedContact, activeInstance]);

  // Send message
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!selectedContact || !activeInstance || !text.trim()) {
      console.warn('[WhatsApp Chat Messages FASE 3] ⚠️ Cannot send message: missing data');
      return false;
    }

    setIsSending(true);
    try {
      console.log('[WhatsApp Chat Messages FASE 3] 📤 Sending message:', {
        instanceId: activeInstance.id,
        phone: selectedContact.phone,
        textLength: text.length
      });

      const result = await WhatsAppWebService.sendMessage(
        activeInstance.id,
        selectedContact.phone,
        text
      );

      if (result.success) {
        console.log('[WhatsApp Chat Messages FASE 3] ✅ Message sent successfully');
        
        // Update contact last message info
        await supabase
          .from('leads')
          .update({
            last_message: text,
            last_message_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedContact.id);

        // Refresh messages to show sent message
        await fetchMessages();
        return true;
      } else {
        console.error('[WhatsApp Chat Messages FASE 3] ❌ Failed to send message:', result.error);
        return false;
      }
    } catch (error) {
      console.error('[WhatsApp Chat Messages FASE 3] ❌ Error sending message:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [selectedContact, activeInstance, fetchMessages]);

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
