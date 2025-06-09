
import { useState, useCallback, useEffect } from 'react';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';
import { toast } from "sonner";

export const useWhatsAppWebChatIntegrated = (activeInstance: WhatsAppWebInstance | null) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
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
        .order('name', { ascending: true });

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
    } catch (error: any) {
      console.error('[WhatsApp Chat] ❌ Error fetching contacts:', error);
      toast.error(`Erro ao buscar contatos: ${error.message}`);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [activeInstance]);

  // Fetch messages for a contact
  const fetchMessages = useCallback(async (contact: Contact | null) => {
    if (!activeInstance || !contact) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('whatsapp_number_id', activeInstance.id)
        .eq('lead_id', contact.id)
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
    } catch (error: any) {
      console.error('[WhatsApp Chat] ❌ Error fetching messages:', error);
      toast.error(`Erro ao buscar mensagens: ${error.message}`);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeInstance]);

  // Send message
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!activeInstance || !selectedContact) {
      toast.error('Instância ou contato não selecionado');
      return false;
    }

    setIsSending(true);
    try {
      const result = await WhatsAppWebService.sendMessage(activeInstance.id, selectedContact.phone, text);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao enviar mensagem');
      }

      // Refresh messages after sending
      setTimeout(() => fetchMessages(selectedContact), 500);
      return true;
    } catch (error: any) {
      console.error('[WhatsApp Chat] ❌ Error sending message:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [activeInstance, selectedContact, fetchMessages]);

  // Load contacts on instance change
  useEffect(() => {
    fetchContacts();
  }, [activeInstance, fetchContacts]);

  // Load messages when selected contact changes
  useEffect(() => {
    fetchMessages(selectedContact);
  }, [selectedContact, fetchMessages]);

  return {
    contacts,
    messages,
    selectedContact,
    setSelectedContact,
    sendMessage,
    isLoadingContacts,
    isLoadingMessages,
    isSending,
    fetchContacts,
    fetchMessages
  };
};
