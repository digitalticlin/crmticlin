
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from './useWhatsAppWebInstances';
import { useChatDatabase } from './useChatDatabase';
import { WebhookConfigService } from '@/services/whatsapp/webhookConfigService';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';

export const useWhatsAppWebChatIntegrated = (activeInstance: WhatsAppWebInstance | null) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const isMountedRef = useRef(true);
  const { mapLeadToContact, mapDbMessageToMessage } = useChatDatabase();

  // Configurar webhook automaticamente quando instância estiver conectada
  useEffect(() => {
    if (activeInstance && 
        ['open', 'ready'].includes(activeInstance.connection_status) && 
        activeInstance.vps_instance_id) {
      
      console.log('[WhatsApp Chat Integrated] 🔧 Configurando webhook para instância conectada');
      WebhookConfigService.configureWebhookForInstance(activeInstance.vps_instance_id)
        .then(() => {
          console.log('[WhatsApp Chat Integrated] ✅ Webhook configurado automaticamente');
        })
        .catch((error) => {
          console.error('[WhatsApp Chat Integrated] ❌ Erro ao configurar webhook:', error);
        });
    }
  }, [activeInstance?.connection_status, activeInstance?.vps_instance_id]);

  // Fetch contacts (leads) from database
  const fetchContacts = async () => {
    if (!activeInstance || !isMountedRef.current) {
      return;
    }

    try {
      setIsLoadingContacts(true);
      console.log('[WhatsApp Chat Integrated] Fetching contacts from database...');

      const { data: leadsData, error } = await supabase
        .from('leads')
        .select('*')
        .eq('whatsapp_number_id', activeInstance.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[WhatsApp Chat Integrated] Error fetching contacts:', error);
        return;
      }

      if (isMountedRef.current && leadsData) {
        const mappedContacts = leadsData.map(lead => mapLeadToContact(lead));
        setContacts(mappedContacts);
        console.log('[WhatsApp Chat Integrated] Contacts loaded:', mappedContacts.length);
      }
    } catch (error) {
      console.error('[WhatsApp Chat Integrated] Error in fetchContacts:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingContacts(false);
      }
    }
  };

  // Fetch messages for selected contact
  const fetchMessages = async () => {
    if (!activeInstance || !selectedContact || !isMountedRef.current) {
      return;
    }

    try {
      setIsLoadingMessages(true);
      console.log('[WhatsApp Chat Integrated] Fetching messages for contact:', selectedContact.id);

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', selectedContact.id)
        .eq('whatsapp_number_id', activeInstance.id)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('[WhatsApp Chat Integrated] Error fetching messages:', error);
        return;
      }

      if (isMountedRef.current && messagesData) {
        const mappedMessages = messagesData.map(msg => mapDbMessageToMessage(msg));
        setMessages(mappedMessages);
        console.log('[WhatsApp Chat Integrated] Messages loaded:', mappedMessages.length);
      }
    } catch (error) {
      console.error('[WhatsApp Chat Integrated] Error in fetchMessages:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingMessages(false);
      }
    }
  };

  // Send message via WhatsApp Web Service
  const sendMessage = async (text: string) => {
    if (!selectedContact || !activeInstance || !text.trim()) {
      return;
    }

    try {
      setIsSending(true);
      console.log('[WhatsApp Chat Integrated] Sending message via integrated service...');

      const result = await WhatsAppWebService.sendMessage(
        activeInstance.vps_instance_id || activeInstance.id,
        selectedContact.phone.replace(/\D/g, ''),
        text
      );

      if (result.success) {
        console.log('[WhatsApp Chat Integrated] Message sent successfully');
        
        // Atualizar último mensagem do lead
        await supabase
          .from('leads')
          .update({
            last_message: text,
            last_message_time: new Date().toISOString()
          })
          .eq('id', selectedContact.id);
        
        // Refresh messages after sending
        setTimeout(() => fetchMessages(), 1000);
      } else {
        console.error('[WhatsApp Chat Integrated] Failed to send message:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[WhatsApp Chat Integrated] Error in sendMessage:', error);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  // Load contacts when active instance changes
  useEffect(() => {
    if (activeInstance) {
      fetchContacts();
    } else {
      setContacts([]);
    }
  }, [activeInstance]);

  // Load messages when selected contact changes
  useEffect(() => {
    if (selectedContact) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [selectedContact]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!activeInstance || !selectedContact) return;

    console.log('[WhatsApp Chat Integrated] Setting up realtime for messages...');

    const channel = supabase
      .channel(`messages-integrated-${selectedContact.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${selectedContact.id}`
        },
        (payload) => {
          console.log('[WhatsApp Chat Integrated] New message realtime:', payload.eventType);
          if (isMountedRef.current) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeInstance, selectedContact]);

  // Realtime subscription for contacts (leads)
  useEffect(() => {
    if (!activeInstance) return;

    console.log('[WhatsApp Chat Integrated] Setting up realtime for contacts...');

    const channel = supabase
      .channel(`leads-integrated-${activeInstance.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `whatsapp_number_id=eq.${activeInstance.id}`
        },
        (payload) => {
          console.log('[WhatsApp Chat Integrated] Contacts realtime update:', payload.eventType);
          if (isMountedRef.current) {
            fetchContacts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeInstance]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage,
    isLoadingContacts,
    isLoadingMessages,
    isSending,
    fetchContacts,
    fetchMessages
  };
};
