
import { supabase } from "@/integrations/supabase/client";
import { Contact, Message } from '@/types/chat';
import { toast } from "sonner";
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';
import { WhatsAppWebInstance } from '@/types/whatsapp';

export class MessageService {
  static async fetchMessages(contact: Contact, instance: WhatsAppWebInstance): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', contact.id)
        .eq('whatsapp_number_id', instance.id)
        .order('timestamp', { ascending: true });

      if (error) {
        throw new Error(`Erro ao buscar mensagens: ${error.message}`);
      }

      // Map database messages to Message interface
      const messages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        text: msg.text || '',
        fromMe: msg.from_me,
        timestamp: msg.timestamp,
        status: (msg.status as "sent" | "delivered" | "read") || "sent",
        mediaType: (msg.media_type as "text" | "image" | "video" | "audio" | "document") || "text",
        mediaUrl: msg.media_url,
        sender: msg.from_me ? "user" : "contact",
        time: new Date(msg.timestamp).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isIncoming: !msg.from_me
      }));

      return messages;
    } catch (error: any) {
      console.error('[WhatsApp Chat Messages FASE 3] ❌ Erro ao buscar mensagens:', error);
      toast.error(`Erro ao buscar mensagens: ${error.message}`);
      return [];
    }
  }

  static async sendMessage(contact: Contact, instance: WhatsAppWebInstance, text: string): Promise<boolean> {
    try {
      if (!contact?.phone) {
        toast.error('Número de telefone do contato não encontrado.');
        return false;
      }

      if (!instance?.id) {
        toast.error('Instância WhatsApp não identificada.');
        return false;
      }

      const result = await WhatsAppWebService.sendMessage(instance.id, contact.phone, text);

      if (!result.success) {
        toast.error(result.error || 'Erro ao enviar mensagem');
        return false;
      }

      toast.success('Mensagem enviada!');
      return true;
    } catch (error: any) {
      console.error('[WhatsApp Chat Messages FASE 3] ❌ Erro ao enviar mensagem:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      return false;
    }
  }
}
