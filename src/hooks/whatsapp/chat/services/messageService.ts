
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { mapDbMessageToMessage } from "../helpers/messageHelpers";
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '../../useWhatsAppWebInstances';

export class MessageService {
  static async fetchMessages(
    selectedContact: Contact | null,
    activeInstance: WhatsAppWebInstance | null
  ): Promise<Message[]> {
    if (!selectedContact || !activeInstance) {
      return [];
    }

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

    const chatMessages: Message[] = (data || []).map(mapDbMessageToMessage);

    console.log('[WhatsApp Chat Messages FASE 3] ✅ Messages loaded:', {
      total: chatMessages.length,
      sent: chatMessages.filter(m => m.fromMe).length,
      received: chatMessages.filter(m => !m.fromMe).length,
      lastMessage: chatMessages[chatMessages.length - 1]?.text?.substring(0, 30)
    });
    
    return chatMessages;
  }

  static async sendMessage(
    selectedContact: Contact | null,
    activeInstance: WhatsAppWebInstance | null,
    text: string
  ): Promise<boolean> {
    if (!selectedContact || !activeInstance || !text.trim()) {
      console.warn('[WhatsApp Chat Messages FASE 3] ⚠️ Cannot send message: missing data');
      return false;
    }

    console.log('[WhatsApp Chat Messages FASE 3] 📤 Sending message:', {
      instanceId: activeInstance.id,
      phone: selectedContact.phone,
      textLength: text.length
    });

    const result = await WhatsAppWebService.sendMessage(
      activeInstance.id,
      selectedContact.phone,
      text
    );

    if (result.success) {
      console.log('[MessageSending FASE 3] ✅ Message sent successfully, refreshing messages...');
      
      // Update contact last message info
      await supabase
        .from('leads')
        .update({
          last_message: text,
          last_message_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedContact.id);

      return true;
    } else {
      console.error('[WhatsApp Chat Messages FASE 3] ❌ Failed to send message:', result.error);
      return false;
    }
  }
}
