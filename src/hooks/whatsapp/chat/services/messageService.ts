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
        .eq('instance_id', instance.id)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Erro ao buscar mensagens: ${error.message}`);
      }

      return data || [];
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
