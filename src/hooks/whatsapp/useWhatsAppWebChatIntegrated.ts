import { useState, useCallback, useEffect } from 'react';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';
import { toast } from "sonner";

interface UseWhatsAppWebChatIntegratedProps {
  activeInstance: WhatsAppWebInstance | null;
}

export const useWhatsAppWebChatIntegrated = ({ activeInstance }: UseWhatsAppWebChatIntegratedProps) => {
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
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      const contactsData = data || [];
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
        .eq('instance_id', activeInstance.id)
        .eq('lead_id', contact.id)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      const messagesData = data || [];
      setMessages(messagesData);
    } catch (error: any) {
      console.error('[WhatsApp Chat] ❌ Error fetching messages:', error);
      toast.error(`Erro ao buscar mensagens: ${error.message}`);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeInstance]);

  // Send message
  const sendMessage = useCallback(async (contact: Contact | null, text: string): Promise<boolean> => {
    if (!activeInstance || !contact) {
      toast.error('Instância ou contato não selecionado');
      return false;
    }

    setIsSending(true);
    try {
      const result = await WhatsAppWebService.sendMessage(activeInstance.id, contact.phone, text);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao enviar mensagem');
      }

      // Refresh messages after sending
      setTimeout(() => fetchMessages(contact), 500);
      return true;
    } catch (error: any) {
      console.error('[WhatsApp Chat] ❌ Error sending message:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [activeInstance, fetchMessages]);

  // Load contacts on instance change
  useEffect(() => {
    fetchContacts();
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
