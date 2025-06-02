
import { useState, useEffect, useCallback } from 'react';
import { Contact, Message } from '@/types/chat';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { WhatsAppWebInstance } from './useWhatsAppWebInstances';
import { toast } from "sonner";

/**
 * Hook especializado para chat WhatsApp Web.js - experiência real
 */
export const useWhatsAppWebChat = (activeInstance: WhatsAppWebInstance | null) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Buscar contatos (leads) da instância ativa
  const fetchContacts = useCallback(async () => {
    if (!activeInstance) {
      setContacts([]);
      return;
    }

    setIsLoadingContacts(true);
    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('whatsapp_number_id', activeInstance.id)
        .eq('company_id', activeInstance.company_id)
        .order('last_message_time', { ascending: false, nullsFirst: false });

      if (error) throw error;

      const mappedContacts: Contact[] = (leads || []).map(lead => ({
        id: lead.id,
        name: lead.name || `+${lead.phone}`,
        phone: lead.phone,
        email: lead.email || '',
        address: lead.address || '',
        company: lead.company || '',
        notes: lead.notes || '',
        lastMessage: lead.last_message || '',
        lastMessageTime: lead.last_message_time 
          ? new Date(lead.last_message_time).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          : '',
        unreadCount: lead.unread_count || 0,
        avatar: '',
        isOnline: Math.random() > 0.7 // Simulação básica de status online
      }));

      setContacts(mappedContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setIsLoadingContacts(false);
    }
  }, [activeInstance]);

  // Buscar mensagens do contato selecionado
  const fetchMessages = useCallback(async () => {
    if (!selectedContact || !activeInstance) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    try {
      const { data: dbMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', selectedContact.id)
        .eq('whatsapp_number_id', activeInstance.id)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const mappedMessages: Message[] = (dbMessages || []).map(msg => ({
        id: msg.id,
        text: msg.text || '',
        sender: msg.from_me ? 'user' : 'contact',
        time: new Date(msg.timestamp).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: msg.status === 'sent' ? 'sent' : msg.status === 'delivered' ? 'delivered' : 'read',
        isIncoming: !msg.from_me,
        fromMe: msg.from_me
      }));

      setMessages(mappedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedContact, activeInstance]);

  // Enviar mensagem via WhatsApp Web.js
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!selectedContact || !activeInstance || !text.trim()) return false;

    setIsSending(true);
    try {
      const result = await WhatsAppWebService.sendMessage(
        activeInstance.id,
        selectedContact.phone,
        text.trim()
      );

      if (result.success) {
        // Adicionar mensagem otimista
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}`,
          text: text.trim(),
          sender: 'user',
          time: new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          status: 'sent',
          isIncoming: false,
          fromMe: true
        };

        setMessages(prev => [...prev, optimisticMessage]);
        
        // Atualizar dados após envio
        setTimeout(() => {
          fetchMessages();
          fetchContacts();
        }, 1000);

        return true;
      } else {
        toast.error(`Erro ao enviar mensagem: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [selectedContact, activeInstance, fetchMessages, fetchContacts]);

  // Configurar realtime para novas mensagens
  useEffect(() => {
    if (!activeInstance) return;

    const channel = supabase
      .channel('whatsapp-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `whatsapp_number_id=eq.${activeInstance.id}`
        },
        (payload) => {
          console.log('Nova mensagem recebida:', payload);
          
          // Se é mensagem do contato selecionado, atualizar mensagens
          if (selectedContact && payload.new.lead_id === selectedContact.id) {
            fetchMessages();
          }
          
          // Sempre atualizar lista de contatos
          fetchContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeInstance, selectedContact, fetchMessages, fetchContacts]);

  // Carregar contatos quando instância mudar
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Carregar mensagens quando contato selecionado mudar
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

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
