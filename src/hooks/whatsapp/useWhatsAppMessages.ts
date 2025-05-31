
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from './useWhatsAppWebInstances';

export interface Message {
  id: string;
  text: string;
  from_me: boolean;
  timestamp: string;
  media_type?: string;
  media_url?: string;
  status?: string;
}

export const useWhatsAppMessages = (
  activeInstance: WhatsAppWebInstance | null, 
  selectedContact: Contact | null
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = async () => {
    if (!selectedContact || !activeInstance) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', selectedContact.id)
        .eq('whatsapp_number_id', activeInstance.id)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!selectedContact || !activeInstance || !text.trim()) return false;

    setIsSending(true);
    try {
      const result = await WhatsAppWebService.sendMessage(
        activeInstance.vps_instance_id, 
        selectedContact.phone, 
        text
      );

      if (result.success) {
        // Refresh messages to get the sent message
        await fetchMessages();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error sending message:', error);
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
