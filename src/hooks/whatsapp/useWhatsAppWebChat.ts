
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
      console.log('[WhatsApp Web Chat] 📋 Fetching contacts for instance:', activeInstance.id);

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

      console.log('[WhatsApp Web Chat] ✅ Contacts fetched:', mappedContacts.length);
      setContacts(mappedContacts);
    } catch (error) {
      console.error('[WhatsApp Web Chat] ❌ Error fetching contacts:', error);
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
      console.log('[WhatsApp Web Chat] 💬 Fetching messages for contact:', selectedContact.id);

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

      console.log('[WhatsApp Web Chat] ✅ Messages fetched:', mappedMessages.length);
      setMessages(mappedMessages);
    } catch (error) {
      console.error('[WhatsApp Web Chat] ❌ Error fetching messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedContact, activeInstance]);

  // Enviar mensagem via WhatsApp Web.js - VERSÃO MELHORADA COM OTIMIZAÇÃO
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!selectedContact || !activeInstance || !text.trim()) {
      console.warn('[WhatsApp Web Chat] Cannot send message: missing data');
      return false;
    }

    setIsSending(true);
    
    // MENSAGEM OTIMISTA - Mostrar imediatamente
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

    // Adicionar mensagem otimista à lista
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      console.log('[WhatsApp Web Chat] 📤 Sending message:', {
        instanceId: activeInstance.id,
        phone: selectedContact.phone,
        text: text.trim()
      });

      const result = await WhatsAppWebService.sendMessage(
        activeInstance.id,
        selectedContact.phone,
        text.trim()
      );

      if (result.success) {
        console.log('[WhatsApp Web Chat] ✅ Message sent successfully');
        
        // Remover mensagem otimista e buscar mensagens reais
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        
        // Atualizar dados após envio (com delay para dar tempo do webhook processar)
        setTimeout(() => {
          fetchMessages();
          fetchContacts();
        }, 1000);

        toast.success('Mensagem enviada com sucesso');
        return true;
      } else {
        console.error('[WhatsApp Web Chat] ❌ Failed to send message:', result.error);
        
        // Remover mensagem otimista em caso de erro
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        
        toast.error(`Erro ao enviar mensagem: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('[WhatsApp Web Chat] ❌ Error sending message:', error);
      
      // Remover mensagem otimista em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      toast.error('Erro ao enviar mensagem');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [selectedContact, activeInstance, fetchMessages, fetchContacts]);

  // Configurar realtime para novas mensagens
  useEffect(() => {
    if (!activeInstance) return;

    console.log('[WhatsApp Web Chat] 🔄 Setting up realtime for instance:', activeInstance.id);

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
          console.log('[WhatsApp Web Chat] 🔄 Nova mensagem recebida via realtime:', payload);
          
          // Se é mensagem do contato selecionado, atualizar mensagens
          if (selectedContact && payload.new.lead_id === selectedContact.id) {
            console.log('[WhatsApp Web Chat] Updating messages for selected contact');
            fetchMessages();
          }
          
          // Sempre atualizar lista de contatos
          console.log('[WhatsApp Web Chat] Updating contacts list');
          fetchContacts();
        }
      )
      .subscribe();

    return () => {
      console.log('[WhatsApp Web Chat] 🧹 Cleaning up realtime subscription');
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
