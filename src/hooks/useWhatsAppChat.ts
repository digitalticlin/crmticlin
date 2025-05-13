
import { useState, useEffect, useCallback } from 'react';
import { Contact, Message } from '@/types/chat';
import { useWhatsAppInstanceState } from '@/hooks/whatsapp/whatsappInstanceStore';
import { evolutionApiService } from '@/services/evolution-api';
import { useChatDatabase } from '@/hooks/whatsapp/useChatDatabase';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useWhatsAppChat = (userEmail: string) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Get active WhatsApp instance
  const { instances } = useWhatsAppInstanceState();
  const activeInstance = instances.length > 0 ? instances[0] : null;
  
  // Get user company ID
  const [companyId, setCompanyId] = useState<string | null>(null);
  
  // Database operations
  const { saveChatsAsLeads, saveMessages } = useChatDatabase();
  
  // Fetch company ID for the current user
  useEffect(() => {
    const fetchCompanyId = async () => {
      if (!userEmail) return;
      
      try {
        const { data: userData } = await supabase.auth.getUser();
        
        if (!userData?.user) {
          console.error("No authenticated user found");
          return;
        }
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', userData.user.id)
          .single();
        
        if (profile && profile.company_id) {
          setCompanyId(profile.company_id);
        } else {
          console.error("User has no associated company");
        }
      } catch (error) {
        console.error("Error fetching company ID:", error);
      }
    };
    
    fetchCompanyId();
  }, [userEmail]);
  
  // Fetch contacts (chats)
  const fetchContacts = useCallback(async () => {
    if (!activeInstance || !companyId || isLoadingContacts) return;
    
    setIsLoadingContacts(true);
    
    try {
      const chats = await evolutionApiService.findChats(activeInstance.instanceName);
      
      if (chats && chats.length > 0) {
        // Save chats as leads in the database
        const contacts = await saveChatsAsLeads(companyId, activeInstance.id, chats);
        setContacts(contacts);
      }
    } catch (error) {
      console.error("Error fetching WhatsApp contacts:", error);
    } finally {
      setIsLoadingContacts(false);
      setLastRefresh(new Date());
    }
  }, [activeInstance, companyId, isLoadingContacts]);
  
  // Fetch messages for selected contact
  const fetchMessages = useCallback(async () => {
    if (!selectedContact || !activeInstance || isLoadingMessages) return;
    
    setIsLoadingMessages(true);
    
    try {
      // Extract phone number from formatted display
      const phone = selectedContact.phone.replace(/\D/g, '');
      
      if (!phone) {
        console.error("Invalid phone number for contact:", selectedContact);
        return;
      }
      
      const jid = `${phone}@s.whatsapp.net`;
      const whatsAppMessages = await evolutionApiService.findMessages(activeInstance.instanceName, jid);
      
      if (whatsAppMessages && whatsAppMessages.length > 0) {
        // Save messages to database and get them mapped to our format
        const savedMessages = await saveMessages(selectedContact.id, activeInstance.id, whatsAppMessages);
        setMessages(savedMessages);
      }
    } catch (error) {
      console.error("Error fetching WhatsApp messages:", error);
    } finally {
      setIsLoadingMessages(false);
      setLastRefresh(new Date());
    }
  }, [selectedContact, activeInstance, isLoadingMessages]);
  
  // Send a message
  const sendMessage = useCallback(async (text: string) => {
    if (!selectedContact || !activeInstance || isSending || !text.trim()) return;
    
    setIsSending(true);
    
    try {
      // Extract phone number from formatted display
      const phone = selectedContact.phone.replace(/\D/g, '');
      
      if (!phone) {
        toast.error("Número de telefone inválido");
        return;
      }
      
      // Send message through Evolution API
      const response = await evolutionApiService.sendMessage(
        activeInstance.instanceName, 
        phone, 
        text
      );
      
      if (response && response.key) {
        // Create a temporary message object for UI
        const newMessage: Message = {
          id: Math.random().toString(), // Temporary ID, will be replaced by DB ID
          text,
          sender: "user",
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          status: "sent",
          isIncoming: false,
          fromMe: true
        };
        
        // Update UI immediately
        setMessages(prev => [...prev, newMessage]);
        
        // Save message to database
        await supabase
          .from('messages')
          .insert({
            lead_id: selectedContact.id,
            whatsapp_number_id: activeInstance.id,
            from_me: true,
            text,
            status: 'sent',
            external_id: response.key.id
          });
        
        // Update lead's last message
        await supabase
          .from('leads')
          .update({
            last_message: text,
            last_message_time: new Date().toISOString()
          })
          .eq('id', selectedContact.id);
        
        // Update local contact list
        const updatedContact = {
          ...selectedContact,
          lastMessage: text,
          lastMessageTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        
        setSelectedContact(updatedContact);
        setContacts(prev => 
          prev.map(contact => 
            contact.id === selectedContact.id ? updatedContact : contact
          )
        );
        
        // Refresh messages to get the actual message from server
        setTimeout(fetchMessages, 1000);
      } else {
        throw new Error("Falha ao enviar mensagem");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsSending(false);
    }
  }, [selectedContact, activeInstance, isSending]);
  
  // Poll for new chats every 3 seconds
  useEffect(() => {
    if (!activeInstance || !companyId) return;
    
    fetchContacts();
    
    const interval = setInterval(() => {
      fetchContacts();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [activeInstance, companyId, fetchContacts]);
  
  // Poll for new messages every 3 seconds when a contact is selected
  useEffect(() => {
    if (!selectedContact || !activeInstance) return;
    
    fetchMessages();
    
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [selectedContact, activeInstance, fetchMessages]);
  
  return {
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage,
    isLoadingContacts,
    isLoadingMessages,
    isSending,
    lastRefresh
  };
};
