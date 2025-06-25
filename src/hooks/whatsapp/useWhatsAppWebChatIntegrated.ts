import { useState, useCallback, useEffect, useRef } from 'react';
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

  // Refs para estabilizar e evitar loops infinitos
  const activeInstanceRef = useRef<WhatsAppWebInstance | null>(null);
  const selectedContactRef = useRef<Contact | null>(null);
  const isLoadingContactsRef = useRef(false);
  const isLoadingMessagesRef = useRef(false);
  
  activeInstanceRef.current = activeInstance;
  selectedContactRef.current = selectedContact;

  // Fetch contacts (using leads table) - ESTÁVEL
  const fetchContacts = useCallback(async () => {
    const currentInstance = activeInstanceRef.current;
    
    if (!currentInstance || isLoadingContactsRef.current) {
      setContacts([]);
      return;
    }

    isLoadingContactsRef.current = true;
    setIsLoadingContacts(true);
    
    try {
      console.log('[WhatsApp Chat Integrated] 📞 Fetching contacts for instance:', currentInstance.instance_name);
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('whatsapp_number_id', currentInstance.id)
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

      console.log('[WhatsApp Chat Integrated] ✅ Contacts fetched:', contactsData.length);
      setContacts(contactsData);
    } catch (error: any) {
      console.error('[WhatsApp Chat Integrated] ❌ Error fetching contacts:', error);
      toast.error(`Erro ao buscar contatos: ${error.message}`);
    } finally {
      isLoadingContactsRef.current = false;
      setIsLoadingContacts(false);
    }
  }, []); // SEM DEPENDÊNCIAS - função estável

  // Fetch messages for a contact - ESTÁVEL
  const fetchMessages = useCallback(async (contact: Contact | null = null) => {
    const currentInstance = activeInstanceRef.current;
    const currentContact = contact || selectedContactRef.current;
    
    if (!currentInstance || !currentContact || isLoadingMessagesRef.current) {
      setMessages([]);
      return;
    }

    isLoadingMessagesRef.current = true;
    setIsLoadingMessages(true);
    
    try {
      console.log('[WhatsApp Chat Integrated] 💬 Fetching messages for:', currentContact.name);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('whatsapp_number_id', currentInstance.id)
        .eq('lead_id', currentContact.id)
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

      console.log('[WhatsApp Chat Integrated] ✅ Messages fetched:', messagesData.length);
      setMessages(messagesData);
    } catch (error: any) {
      console.error('[WhatsApp Chat Integrated] ❌ Error fetching messages:', error);
      toast.error(`Erro ao buscar mensagens: ${error.message}`);
    } finally {
      isLoadingMessagesRef.current = false;
      setIsLoadingMessages(false);
    }
  }, []); // SEM DEPENDÊNCIAS - função estável

  // Send message - ESTÁVEL
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    const currentInstance = activeInstanceRef.current;
    const currentContact = selectedContactRef.current;
    
    if (!currentInstance || !currentContact) {
      toast.error('Instância ou contato não selecionado');
      return false;
    }

    setIsSending(true);
    try {
      console.log('[WhatsApp Chat Integrated] 📤 Sending message to:', currentContact.phone);
      
      const result = await WhatsAppWebService.sendMessage(currentInstance.id, currentContact.phone, text);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao enviar mensagem');
      }

      console.log('[WhatsApp Chat Integrated] ✅ Message sent successfully');
      
      // Refresh messages after sending - debounced
      setTimeout(() => fetchMessages(currentContact), 500);
      return true;
    } catch (error: any) {
      console.error('[WhatsApp Chat Integrated] ❌ Error sending message:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      return false;
    } finally {
      setIsSending(false);
    }
  }, []); // SEM DEPENDÊNCIAS - função estável

  // Load contacts on instance change APENAS
  useEffect(() => {
    if (activeInstance?.id) {
      console.log('[WhatsApp Chat Integrated] Instance changed, fetching contacts:', activeInstance.instance_name);
      fetchContacts();
    } else {
      setContacts([]);
    }
  }, [activeInstance?.id]); // APENAS ID da instância

  // Load messages when selected contact changes APENAS
  useEffect(() => {
    if (selectedContact?.id && activeInstance?.id) {
      console.log('[WhatsApp Chat Integrated] Contact changed, fetching messages:', selectedContact.name);
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [selectedContact?.id, activeInstance?.id]); // APENAS IDs

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
