
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

  // Fetch contacts (using leads table)
  const fetchContacts = useCallback(async () => {
    if (!activeInstance) {
      setContacts([]);
      return;
    }

    setIsLoadingContacts(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('whatsapp_number_id', activeInstance.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Map leads to contacts
      const contactsData: Contact[] = (data || []).map(lead => ({
        id: lead.id,
        name: lead.name || lead.phone,
        phone: lead.phone,
        email: lead.email,
        address: lead.address,
        company: lead.company,
        documentId: lead.document_id,
        notes: lead.notes,
        lastMessage: lead.last_message,
        lastMessageTime: lead.last_message_time,
        unreadCount: lead.unread_count || 0,
        createdAt: lead.created_at
      }));

      setContacts(contactsData);
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
        .eq('whatsapp_number_id', activeInstance.id)
        .order('timestamp', { ascending: true });

      if (error) {
        throw error;
      }

      // Map database messages to Message interface
      const messagesData: Message[] = (data || []).map(msg => ({
        id: msg.id,
        text: msg.text || '',
        fromMe: msg.from_me,
        timestamp: msg.timestamp,
        status: (msg.status as "sent" | "delivered" | "read") || "sent",
        mediaType: (msg.media_type as "text" | "image" | "video" | "audio" | "document") || "text",
        mediaUrl: msg.media_url,
        sender: msg.from_me ? "user" : "contact",
        time: new Date(msg.timestamp).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isIncoming: !msg.from_me
      }));

      setMessages(messagesData);
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
            whatsapp_number_id: activeInstance.id,
            lead_id: contact.id,
            text: text,
            from_me: true,
          },
        ]);

      if (error) {
        throw error;
      }

      // Optimistically update the messages
      const newMessage: Message = {
        id: data[0].id,
        text: text,
        fromMe: true,
        timestamp: new Date().toISOString(),
        status: "sent",
        mediaType: "text",
        sender: "user",
        time: new Date().toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isIncoming: false
      };

      setMessages(prevMessages => [...prevMessages, newMessage]);
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
