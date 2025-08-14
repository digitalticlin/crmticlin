
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { KanbanLead } from '@/types/kanban';
import { Message } from '@/types/chat';
import { toast } from 'sonner';

export interface Contact extends KanbanLead {
  lastMessageTime: string;
  avatar?: string;
}

export const useWhatsAppChat = (instanceId?: string) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const { user } = useAuth();

  // Load contacts (leads) for the user
  const loadContacts = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data: leadsData, error } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          phone,
          email,
          address,
          company,
          document_id,
          notes,
          purchase_value,
          owner_id,
          last_message,
          last_message_time,
          unread_count,
          whatsapp_number_id,
          kanban_stage_id,
          created_at
        `)
        .eq('created_by_user_id', user.id)
        .order('last_message_time', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('[useWhatsAppChat] Error loading contacts:', error);
        toast.error('Erro ao carregar contatos');
        return;
      }

      if (leadsData) {
        const transformedContacts: Contact[] = leadsData.map(lead => ({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email || '',
          address: lead.address || '',
          company: lead.company || '',
          documentId: lead.document_id || '',
          notes: lead.notes || '',
          purchaseValue: lead.purchase_value || 0,
          assignedUser: lead.owner_id || '',
          lastMessage: lead.last_message || '',
          lastMessageTime: lead.last_message_time || lead.created_at,
          unreadCount: lead.unread_count || 0,
          columnId: lead.kanban_stage_id || '',
          whatsapp_number_id: lead.whatsapp_number_id,
          kanban_stage_id: lead.kanban_stage_id,
          created_at: lead.created_at,
          tags: [],
          funnel_id: '',
          // Add profile pic support when available
          avatar: undefined
        }));

        setContacts(transformedContacts);
      }
    } catch (error: any) {
      console.error('[useWhatsAppChat] Error loading contacts:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load messages for selected contact
  const loadMessages = useCallback(async (leadId: string) => {
    if (!user?.id) return;

    setIsLoadingMessages(true);
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .eq('created_by_user_id', user.id)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('[useWhatsAppChat] Error loading messages:', error);
        toast.error('Erro ao carregar mensagens');
        return;
      }

      if (messagesData) {
        const transformedMessages: Message[] = messagesData.map(msg => ({
          id: msg.id,
          content: msg.text || '',
          timestamp: msg.timestamp,
          fromMe: msg.from_me || false,
          leadId: msg.lead_id,
          mediaType: msg.media_type || 'text',
          mediaUrl: msg.media_url,
          status: msg.status || 'sent'
        }));

        setMessages(transformedMessages);

        // Mark messages as read
        if (transformedMessages.some(msg => !msg.fromMe)) {
          await supabase
            .from('leads')
            .update({ unread_count: 0 })
            .eq('id', leadId)
            .eq('created_by_user_id', user.id);

          // Update local contacts state
          setContacts(prev => prev.map(contact => 
            contact.id === leadId 
              ? { ...contact, unreadCount: 0 }
              : contact
          ));
        }
      }
    } catch (error: any) {
      console.error('[useWhatsAppChat] Error loading messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user?.id]);

  // Send message
  const sendMessage = useCallback(async (
    content: string, 
    mediaType: string = 'text', 
    mediaUrl?: string
  ) => {
    if (!selectedContact || !user?.id) return { success: false };

    try {
      const newMessage = {
        text: content,
        from_me: true,
        lead_id: selectedContact.id,
        created_by_user_id: user.id,
        whatsapp_number_id: selectedContact.whatsapp_number_id,
        media_type: mediaType as any, // Cast to match enum
        media_url: mediaUrl,
        timestamp: new Date().toISOString(),
        status: 'sent' as any
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(newMessage)
        .select()
        .single();

      if (error) {
        console.error('[useWhatsAppChat] Error sending message:', error);
        toast.error('Erro ao enviar mensagem');
        return { success: false };
      }

      if (data) {
        // Add to local messages
        const transformedMessage: Message = {
          id: data.id,
          content: data.text || '',
          timestamp: data.timestamp,
          fromMe: data.from_me || false,
          leadId: data.lead_id,
          mediaType: data.media_type || 'text',
          mediaUrl: data.media_url,
          status: data.status || 'sent'
        };

        setMessages(prev => [...prev, transformedMessage]);

        // Update last message in contacts
        setContacts(prev => prev.map(contact => 
          contact.id === selectedContact.id 
            ? { 
                ...contact, 
                lastMessage: content,
                lastMessageTime: new Date().toISOString()
              }
            : contact
        ));

        return { success: true, messageId: data.id };
      }

      return { success: false };
    } catch (error: any) {
      console.error('[useWhatsAppChat] Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
      return { success: false };
    }
  }, [selectedContact, user?.id]);

  // Select contact
  const selectContact = useCallback((contact: Contact) => {
    setSelectedContact(contact);
    loadMessages(contact.id);
  }, [loadMessages]);

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  return {
    contacts,
    selectedContact,
    messages,
    isLoading,
    isLoadingMessages,
    selectContact,
    sendMessage,
    refreshContacts: loadContacts,
    refreshMessages: () => selectedContact && loadMessages(selectedContact.id)
  };
};
