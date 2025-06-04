
import { useState, useCallback } from 'react';
import { Message } from '@/types/chat';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { WhatsAppWebInstance } from '../useWhatsAppWebInstances';
import { Contact } from '@/types/chat';
import { toast } from "sonner";

/**
 * Hook para gerenciar mensagens do chat WhatsApp Web
 */
export const useWhatsAppChatMessages = (
  selectedContact: Contact | null,
  activeInstance: WhatsAppWebInstance | null
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

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

  // Enviar mensagem via WhatsApp Web.js - VERSÃO OTIMIZADA
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!selectedContact || !activeInstance || !text.trim()) {
      console.warn('[WhatsApp Web Chat] Cannot send message: missing data');
      toast.error('Dados insuficientes para envio');
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
        
        // Remover mensagem otimista
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        
        // Atualizar dados após envio (com delay para dar tempo do webhook processar)
        setTimeout(async () => {
          await fetchMessages();
        }, 1000);

        toast.success('Mensagem enviada');
        return true;
      } else {
        console.error('[WhatsApp Web Chat] ❌ Failed to send message:', result.error);
        
        // Remover mensagem otimista em caso de erro
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        
        toast.error(`Erro ao enviar: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('[WhatsApp Web Chat] ❌ Error sending message:', error);
      
      // Remover mensagem otimista em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      toast.error('Erro inesperado ao enviar mensagem');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [selectedContact, activeInstance, fetchMessages]);

  return {
    messages,
    isLoadingMessages,
    isSending,
    fetchMessages,
    sendMessage,
    setMessages
  };
};
