import { useState, useCallback, useEffect } from 'react';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { supabase } from "@/integrations/supabase/client";

export const useWhatsAppWebChat = (activeInstance: WhatsAppWebInstance | null) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    if (!activeInstance) {
      setContacts([]);
      return;
    }

    setIsLoadingContacts(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('instance_id', activeInstance.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setContacts(data || []);
    } catch (error) {
      console.error('[WhatsApp Chat] ❌ Error fetching contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [activeInstance]);

  // Fetch messages for a contact
  const fetchMessages = useCallback(async (contact: Contact | null) => {
    if (!contact || !activeInstance) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', contact.id)
        .eq('instance_id', activeInstance.id)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('[WhatsApp Chat] ❌ Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeInstance]);

  // Send message
  const sendMessage = useCallback(async (contact: Contact | null, text: string): Promise<boolean> => {
    if (!contact || !activeInstance) {
      return false;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            instance_id: activeInstance.id,
            lead_id: contact.id,
            text: text,
            from_me: true,
          },
        ]);

      if (error) {
        throw error;
      }

      // Optimistically update the messages
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: data[0].id,
          instance_id: activeInstance.id,
          lead_id: contact.id,
          text: text,
          from_me: true,
          created_at: new Date().toISOString(),
        }
      ]);

      return true;
    } catch (error) {
      console.error('[WhatsApp Chat] ❌ Error sending message:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [activeInstance]);

  useEffect(() => {
    if (activeInstance) {
      fetchContacts();
    }
  }, [activeInstance, fetchContacts]);

  return {
    contacts,
    messages,
    sendMessage,
    isLoadingContacts,
    isLoadingMessages,
    isSending,
    fetchContacts,
    fetchMessages
  };
};
