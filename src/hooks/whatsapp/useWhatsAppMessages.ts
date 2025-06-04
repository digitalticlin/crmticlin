
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from './useWhatsAppWebInstances';

export const useWhatsAppMessages = (
  activeInstance: WhatsAppWebInstance | null, 
  selectedContact: Contact | null
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Helper function to normalize status
  const normalizeStatus = (status: string | null): "sent" | "delivered" | "read" => {
    if (status === 'delivered') return 'delivered';
    if (status === 'read') return 'read';
    return 'sent'; // default
  };

  // Helper function to normalize media type
  const normalizeMediaType = (mediaType: string | null): "text" | "image" | "video" | "audio" | "document" => {
    if (mediaType === 'image') return 'image';
    if (mediaType === 'video') return 'video';
    if (mediaType === 'audio') return 'audio';
    if (mediaType === 'document') return 'document';
    return 'text'; // default
  };

  const fetchMessages = async () => {
    if (!selectedContact || !activeInstance) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    try {
      console.log('[useWhatsAppMessages FASE 3] Fetching messages for:', {
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
      
      // Convert database messages to chat Message format
      const chatMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        text: msg.text || '',
        sender: msg.from_me ? 'user' : 'contact',
        time: new Date(msg.timestamp).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: normalizeStatus(msg.status),
        isIncoming: !msg.from_me,
        fromMe: msg.from_me,
        timestamp: msg.timestamp,
        mediaType: normalizeMediaType(msg.media_type),
        mediaUrl: msg.media_url
      }));
      
      console.log('[useWhatsAppMessages FASE 3] ✅ Messages fetched:', chatMessages.length);
      setMessages(chatMessages);
    } catch (error) {
      console.error('[useWhatsAppMessages FASE 3] ❌ Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!selectedContact || !activeInstance || !text.trim()) {
      console.warn('[useWhatsAppMessages FASE 3] Cannot send message: missing data');
      return false;
    }

    setIsSending(true);
    try {
      console.log('[useWhatsAppMessages FASE 3] 📤 Sending message:', {
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
        console.log('[useWhatsAppMessages FASE 3] ✅ Message sent successfully');
        // Refresh messages to get the sent message
        await fetchMessages();
        return true;
      } else {
        console.error('[useWhatsAppMessages FASE 3] ❌ Failed to send message:', result.error);
        return false;
      }
    } catch (error) {
      console.error('[useWhatsAppMessages FASE 3] ❌ Error sending message:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [selectedContact, activeInstance]);

  return {
    messages,
    fetchMessages,
    sendMessage,
    isLoadingMessages,
    isSending
  };
};
