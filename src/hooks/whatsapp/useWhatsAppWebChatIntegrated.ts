import { useState, useCallback, useEffect, useRef } from 'react';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';
import { toast } from "sonner";
import { useWhatsAppChatRealtime } from './chat/useWhatsAppChatRealtime';

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

  // Fetch contacts com ordenação otimizada - ESTÁVEL
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
        .order('last_message_time', { ascending: false, nullsFirst: false })
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      // Map leads to contacts com formatação otimizada
      const contactsData: Contact[] = (data || []).map(lead => {
        // Cast para incluir o novo campo profile_pic_url
        const leadWithProfilePic = lead as any;
        
        return {
          id: lead.id,
          name: lead.name || lead.phone,
          phone: lead.phone,
          email: lead.email,
          address: lead.address,
          company: lead.company,
          documentId: lead.document_id,
          notes: lead.notes,
          lastMessage: lead.last_message,
          lastMessageTime: lead.last_message_time ? 
            new Date(lead.last_message_time).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : undefined,
          unreadCount: lead.unread_count || 0,
          createdAt: lead.created_at,
          profilePicUrl: leadWithProfilePic.profile_pic_url || '', // Novo campo para foto de perfil do WhatsApp
          isOnline: false // Placeholder para futuro
        };
      });

      console.log('[WhatsApp Chat Integrated] ✅ Contacts fetched and sorted:', contactsData.length);
      setContacts(contactsData);
    } catch (error: any) {
      console.error('[WhatsApp Chat Integrated] ❌ Error fetching contacts:', error);
      toast.error(`Erro ao buscar contatos: ${error.message}`);
    } finally {
      isLoadingContactsRef.current = false;
      setIsLoadingContacts(false);
    }
  }, []); // SEM DEPENDÊNCIAS - função estável

  // Função para mover contato para o topo - OTIMIZADA
  const moveContactToTop = useCallback((contactId: string) => {
    setContacts(prevContacts => {
      const contactIndex = prevContacts.findIndex(c => c.id === contactId);
      if (contactIndex <= 0) return prevContacts; // Já está no topo ou não existe
      
      const contactToMove = prevContacts[contactIndex];
      const newContacts = [...prevContacts];
      newContacts.splice(contactIndex, 1);
      newContacts.unshift(contactToMove);
      
      console.log('[WhatsApp Chat Integrated] 📈 Contato movido para o topo:', contactToMove.name);
      return newContacts;
    });
  }, []);

  // Fetch messages para um contato - OTIMIZADA
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

      if (error) throw error;
      
      // Convert to Message format com status otimizado
      const messagesData: Message[] = (data || []).map(msg => {
        let status: "sent" | "delivered" | "read" = "sent";
        if (msg.status === 'delivered' || msg.status === 'received') status = "delivered";
        else if (msg.status === 'read') status = "read";

        return {
          id: msg.id,
          text: msg.text || '',
          sender: msg.from_me ? 'user' : 'contact',
          time: new Date(msg.timestamp).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          status,
          isIncoming: !msg.from_me,
          fromMe: msg.from_me,
          timestamp: msg.timestamp,
          mediaType: (msg.media_type as any) || 'text',
          mediaUrl: msg.media_url
        };
      });
      
      console.log('[WhatsApp Chat Integrated] ✅ Messages fetched:', messagesData.length);
      setMessages(messagesData);

      // Zerar contador não lido quando buscar mensagens do contato selecionado
      if (currentContact.unreadCount && currentContact.unreadCount > 0) {
        await supabase
          .from('leads')
          .update({ unread_count: 0 })
          .eq('id', currentContact.id);
        
        // Atualizar estado local
        setContacts(prevContacts => 
          prevContacts.map(c => 
            c.id === currentContact.id ? { ...c, unreadCount: 0 } : c
          )
        );
      }
    } catch (error: any) {
      console.error('[WhatsApp Chat Integrated] ❌ Error fetching messages:', error);
      toast.error(`Erro ao buscar mensagens: ${error.message}`);
    } finally {
      isLoadingMessagesRef.current = false;
      setIsLoadingMessages(false);
    }
  }, []); // SEM DEPENDÊNCIAS - função estável

  // Send message otimizado
  const sendMessage = useCallback(async (text: string) => {
    const currentInstance = activeInstanceRef.current;
    const currentContact = selectedContactRef.current;
    
    if (!currentInstance || !currentContact || !text.trim()) {
      console.warn('[WhatsApp Chat Integrated] Cannot send message: missing data');
      return false;
    }

    setIsSending(true);
    
    // Adicionar mensagem otimisticamente na UI
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
      fromMe: true,
      timestamp: new Date().toISOString(),
      mediaType: 'text'
    };
    
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      console.log('[WhatsApp Chat Integrated] 📤 Sending message:', {
        instanceId: currentInstance.id,
        phone: currentContact.phone,
        textLength: text.length
      });

      const result = await WhatsAppWebService.sendMessage(
        currentInstance.id,
        currentContact.phone, 
        text
      );

      if (result.success) {
        console.log('[WhatsApp Chat Integrated] ✅ Message sent successfully');
        
        // Mover contato para o topo
        moveContactToTop(currentContact.id);
        
        // Refresh messages após pequeno delay para pegar a mensagem salva
        setTimeout(() => fetchMessages(), 500);
        return true;
      } else {
        console.error('[WhatsApp Chat Integrated] ❌ Failed to send message:', result.error);
        
        // Remover mensagem otimística em caso de erro
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        toast.error(result.error || 'Erro ao enviar mensagem');
        return false;
      }
    } catch (error: any) {
      console.error('[WhatsApp Chat Integrated] ❌ Error sending message:', error);
      
      // Remover mensagem otimística em caso de erro
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [moveContactToTop, fetchMessages]);

  // Configurar tempo real otimizado
  useWhatsAppChatRealtime({
    activeInstance,
    selectedContact,
    onMessageReceived: (leadId: string) => {
      if (selectedContact && leadId === selectedContact.id) {
        fetchMessages();
      }
    },
    onContactUpdate: fetchContacts,
    onMoveContactToTop: moveContactToTop
  });

  // Effect inicial para carregar contatos
  useEffect(() => {
    if (activeInstance) {
      fetchContacts();
    }
  }, [activeInstance?.id, fetchContacts]);

  // Effect para carregar mensagens quando contato selecionado mudar
  useEffect(() => {
    if (selectedContact && activeInstance) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [selectedContact?.id, activeInstance?.id, fetchMessages]);

  return {
    contacts,
    setContacts,
    selectedContact,
    setSelectedContact,
    messages,
    isLoadingContacts,
    isLoadingMessages,
    isSending,
    fetchContacts,
    fetchMessages,
    sendMessage,
    moveContactToTop
  };
};
