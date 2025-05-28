
import { useState, useCallback } from 'react';
import { Message } from '@/types/chat';
import { evolutionApiService } from '@/services/evolution-api';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook para mensagens WhatsApp — carrega do banco de dados
 */
export const useWhatsAppMessages = (activeInstance: any, selectedContact: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Carregar mensagens do banco de dados
  const fetchMessages = useCallback(async () => {
    if (!selectedContact || !activeInstance || isLoadingMessages) return;
    setIsLoadingMessages(true);

    try {
      // Buscar mensagens da tabela messages
      const { data: dbMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', selectedContact.id)
        .eq('whatsapp_number_id', activeInstance.id)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      if (dbMessages && dbMessages.length > 0) {
        const mappedMessages: Message[] = dbMessages.map(dbMessage => ({
          id: dbMessage.id,
          text: dbMessage.text || "",
          sender: dbMessage.from_me ? "user" : "contact",
          time: new Date(dbMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          status: dbMessage.status || "sent",
          isIncoming: !dbMessage.from_me,
          fromMe: dbMessage.from_me
        }));

        setMessages(mappedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching WhatsApp messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedContact, activeInstance, isLoadingMessages]);

  // Envio de mensagem
  const sendMessage = useCallback(async (text: string) => {
    if (!selectedContact || !activeInstance || isSending || !text.trim()) return;
    setIsSending(true);

    try {
      const phone = selectedContact.phone.replace(/\D/g, '');
      if (!phone) {
        toast.error("Número de telefone inválido");
        return;
      }

      // Enviar via Evolution API
      const response = await evolutionApiService.sendMessage(
        activeInstance.instanceName,
        phone,
        text
      );
      
      if (response && response.key) {
        const newMessage: Message = {
          id: Math.random().toString(),
          text,
          sender: "user",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: "sent",
          isIncoming: false,
          fromMe: true
        };
        setMessages(prev => [...prev, newMessage]);

        // Salvar no banco de dados
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

        // Atualizar lead
        await supabase
          .from('leads')
          .update({
            last_message: text,
            last_message_time: new Date().toISOString()
          })
          .eq('id', selectedContact.id);

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

  return {
    messages,
    fetchMessages,
    sendMessage,
    isLoadingMessages,
    isSending
  };
};
