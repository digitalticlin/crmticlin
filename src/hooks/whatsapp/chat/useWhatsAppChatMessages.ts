
// FASE 3: Hook otimizado para mensagens do chat WhatsApp
import { useState, useEffect, useCallback } from 'react';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '../useWhatsAppWebInstances';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";

export const useWhatsAppChatMessages = (
  selectedContact: Contact | null,
  activeInstance: WhatsAppWebInstance | null
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Helper function to normalize status
  const normalizeStatus = (status: string | null): "sent" | "delivered" | "read" => {
    if (status === 'delivered') return 'delivered';
    if (status === 'read') return 'read';
    return 'sent'; // default
  };

  // Helper function to normalize media type
  const normalizeMediaType = (mediaType: string | null): "text" | "image" | "video" | "audio" | "document" => {
    if (mediaType === 'image') return 'image';
    if (mediaType === 'video') return 'video';
    if (mediaType === 'audio') return 'audio';
    if (mediaType === 'document') return 'document';
    return 'text'; // default
  };

  // Fetch messages for selected contact
  const fetchMessages = useCallback(async () => {
    if (!selectedContact || !activeInstance) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    try {
      console.log('[WhatsApp Chat Messages FASE 3] 📥 Fetching messages:', {
        leadId: selectedContact.id,
        instanceId: activeInstance.id
      });

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', selectedContact.id)
        .eq('whatsapp_number_id', activeInstance.id)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // CORRIGIDO: Mapeamento mais robusto incluindo TODAS as mensagens
      const chatMessages: Message[] = (data || []).map(msg => {
        const isFromMe = msg.from_me === true;
        
        return {
          id: msg.id,
          text: msg.text || '',
          fromMe: isFromMe,
          timestamp: msg.timestamp,
          status: normalizeStatus(msg.status),
          mediaType: normalizeMediaType(msg.media_type),
          mediaUrl: msg.media_url,
          // Compatibility fields for UI
          sender: isFromMe ? 'user' : 'contact',
          time: new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          isIncoming: !isFromMe
        };
      });

      console.log('[WhatsApp Chat Messages FASE 3] ✅ Messages loaded:', {
        total: chatMessages.length,
        sent: chatMessages.filter(m => m.fromMe).length,
        received: chatMessages.filter(m => !m.fromMe).length,
        lastMessage: chatMessages[chatMessages.length - 1]?.text?.substring(0, 30)
      });
      
      setMessages(chatMessages);
    } catch (error) {
      console.error('[WhatsApp Chat Messages FASE 3] ❌ Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedContact, activeInstance]);

  // Send message
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!selectedContact || !activeInstance || !text.trim()) {
      console.warn('[WhatsApp Chat Messages FASE 3] ⚠️ Cannot send message: missing data');
      return false;
    }

    setIsSending(true);
    try {
      console.log('[WhatsApp Chat Messages FASE 3] 📤 Sending message:', {
        instanceId: activeInstance.id,
        phone: selectedContact.phone,
        textLength: text.length
      });

      // CORRIGIDO: Usar o ID correto da instância (UUID)
      const result = await WhatsAppWebService.sendMessage(
        activeInstance.id, // Usando o UUID da instância
        selectedContact.phone,
        text
      );

      if (result.success) {
        console.log('[WhatsApp Chat Messages FASE 3] ✅ Message sent successfully');
        
        // Update contact last message info
        await supabase
          .from('leads')
          .update({
            last_message: text,
            last_message_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedContact.id);

        // CORRIGIDO: Refresh messages mais rápido para mostrar a mensagem enviada
        setTimeout(() => fetchMessages(), 300);
        return true;
      } else {
        console.error('[WhatsApp Chat Messages FASE 3] ❌ Failed to send message:', result.error);
        return false;
      }
    } catch (error) {
      console.error('[WhatsApp Chat Messages FASE 3] ❌ Error sending message:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [selectedContact, activeInstance, fetchMessages]);

  // Fetch messages when dependencies change
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // CORRIGIDO: Realtime subscription mais eficiente com type checking
  useEffect(() => {
    if (!activeInstance || !selectedContact) return;

    console.log('[WhatsApp Chat Messages FASE 3] 🔄 Setting up realtime for messages...');

    const channel = supabase
      .channel(`messages-${selectedContact.id}-${activeInstance.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${selectedContact.id}`
        },
        (payload) => {
          console.log('[WhatsApp Chat Messages FASE 3] 🔄 Realtime message update:', payload);
          
          // CORRIGIDO: Add type checking for payload.new
          if (payload.new && typeof payload.new === 'object' && 'from_me' in payload.new && 'text' in payload.new) {
            const messageData = payload.new as any;
            console.log('[WhatsApp Chat Messages FASE 3] 🔄 Message details:', {
              event: payload.eventType,
              fromMe: messageData.from_me,
              text: messageData.text?.substring(0, 30)
            });
          }
          
          // Refresh messages on any change
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      console.log('[WhatsApp Chat Messages FASE 3] 🧹 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [activeInstance, selectedContact, fetchMessages]);

  return {
    messages,
    isLoadingMessages,
    isSending,
    fetchMessages,
    sendMessage
  };
};
