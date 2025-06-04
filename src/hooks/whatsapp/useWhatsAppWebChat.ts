
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from './useWhatsAppWebInstances';
import { useChatDatabase } from './useChatDatabase';

// Chat-specific hook that only reads from database
export const useWhatsAppWebChat = (activeInstance: WhatsAppWebInstance | null) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const isMountedRef = useRef(true);
  const { mapLeadToContact, mapDbMessageToMessage } = useChatDatabase();

  // Fetch contacts (leads) from database
  const fetchContacts = async () => {
    if (!activeInstance || !isMountedRef.current) {
      return;
    }

    try {
      setIsLoadingContacts(true);
      console.log('[useWhatsAppWebChat] Fetching contacts from database...');

      const { data: leadsData, error } = await supabase
        .from('leads')
        .select('*')
        .eq('whatsapp_number_id', activeInstance.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[useWhatsAppWebChat] Error fetching contacts:', error);
        return;
      }

      if (isMountedRef.current && leadsData) {
        const mappedContacts = leadsData.map(lead => mapLeadToContact(lead));
        setContacts(mappedContacts);
        console.log('[useWhatsAppWebChat] Contacts loaded:', mappedContacts.length);
      }
    } catch (error) {
      console.error('[useWhatsAppWebChat] Error in fetchContacts:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingContacts(false);
      }
    }
  };

  // Fetch messages for selected contact - fixed to use current selectedContact
  const fetchMessages = async () => {
    if (!activeInstance || !selectedContact || !isMountedRef.current) {
      return;
    }

    try {
      setIsLoadingMessages(true);
      console.log('[useWhatsAppWebChat] Fetching messages for contact:', selectedContact.id);

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', selectedContact.id)
        .eq('whatsapp_number_id', activeInstance.id)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('[useWhatsAppWebChat] Error fetching messages:', error);
        return;
      }

      if (isMountedRef.current && messagesData) {
        const mappedMessages = messagesData.map(msg => mapDbMessageToMessage(msg));
        setMessages(mappedMessages);
        console.log('[useWhatsAppWebChat] Messages loaded:', mappedMessages.length);
      }
    } catch (error) {
      console.error('[useWhatsAppWebChat] Error in fetchMessages:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingMessages(false);
      }
    }
  };

  // Send message (this would use an Edge Function to send via VPS)
  const sendMessage = async (text: string) => {
    if (!selectedContact || !activeInstance || !text.trim()) {
      return;
    }

    try {
      setIsSending(true);
      console.log('[useWhatsAppWebChat] Sending message via Edge Function...');

      // Call Edge Function to send message via VPS
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'send_message',
          instanceId: activeInstance.vps_instance_id,
          to: selectedContact.phone.replace(/\D/g, ''), // Clean phone number
          message: text
        }
      });

      if (error) {
        console.error('[useWhatsAppWebChat] Error sending message:', error);
        throw error;
      }

      console.log('[useWhatsAppWebChat] Message sent successfully');
      
      // Refresh messages after sending
      setTimeout(() => fetchMessages(), 1000);
    } catch (error) {
      console.error('[useWhatsAppWebChat] Error in sendMessage:', error);
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

    console.log('[useWhatsAppWebChat] Setting up realtime for messages...');

    const channel = supabase
      .channel(`messages-${selectedContact.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${selectedContact.id}`
        },
        (payload) => {
          console.log('[useWhatsAppWebChat] New message realtime:', payload.eventType);
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

    console.log('[useWhatsAppWebChat] Setting up realtime for contacts...');

    const channel = supabase
      .channel(`leads-${activeInstance.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `whatsapp_number_id=eq.${activeInstance.id}`
        },
        (payload) => {
          console.log('[useWhatsAppWebChat] Contacts realtime update:', payload.eventType);
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
