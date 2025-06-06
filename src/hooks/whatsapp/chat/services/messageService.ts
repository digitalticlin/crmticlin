
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

    console.log('[Message Service FASE 2.0] 📥 Fetching messages via backend:', {
      leadId: selectedContact.id,
      instanceId: activeInstance.id
    });

    try {
      // FASE 2.0: Usar backend para buscar histórico se necessário, ou continuar com banco direto
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', selectedContact.id)
        .eq('whatsapp_number_id', activeInstance.id)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const chatMessages: Message[] = (data || []).map(mapDbMessageToMessage);

      console.log('[Message Service FASE 2.0] ✅ Messages loaded via database:', {
        total: chatMessages.length,
        sent: chatMessages.filter(m => m.fromMe).length,
        received: chatMessages.filter(m => !m.fromMe).length
      });
      
      return chatMessages;
    } catch (error) {
      console.error('[Message Service FASE 2.0] ❌ Error fetching messages:', error);
      throw error;
    }
  }

  static async sendMessage(
    selectedContact: Contact | null,
    activeInstance: WhatsAppWebInstance | null,
    text: string
  ): Promise<boolean> {
    if (!selectedContact || !activeInstance || !text.trim()) {
      console.warn('[Message Service FASE 2.0] ⚠️ Cannot send message: missing data');
      return false;
    }

    console.log('[Message Service FASE 2.0] 📤 Sending message via backend:', {
      instanceId: activeInstance.id,
      phone: selectedContact.phone,
      textLength: text.length
    });

    try {
      // FASE 2.0: USAR APENAS BACKEND - sem chamadas diretas à VPS
      const result = await WhatsAppWebService.sendMessage(
        activeInstance.id,
        selectedContact.phone,
        text
      );

      if (result.success) {
        console.log('[Message Service FASE 2.0] ✅ Message sent successfully via backend');
        
        // Atualizar informações do contato
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
        console.error('[Message Service FASE 2.0] ❌ Failed to send message via backend:', result.error);
        return false;
      }
    } catch (error) {
      console.error('[Message Service FASE 2.0] ❌ Error sending message via backend:', error);
      return false;
    }
  }
}
