
import { useState, useCallback } from 'react';
import { Message } from '@/types/chat';
import { evolutionApiService } from '@/services/evolution-api';
import { useChatDatabase } from '@/hooks/whatsapp/useChatDatabase';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for managing WhatsApp messages
 */
export const useWhatsAppMessages = (activeInstance: any, selectedContact: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Database operations
  const { saveMessages } = useChatDatabase();
  
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
    }
  }, [selectedContact, activeInstance, isLoadingMessages, saveMessages]);
  
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
  }, [selectedContact, activeInstance, isSending, fetchMessages]);
  
  return {
    messages,
    fetchMessages,
    sendMessage,
    isLoadingMessages,
    isSending
  };
};
