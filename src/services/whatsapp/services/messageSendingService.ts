
import { supabase } from "@/integrations/supabase/client";
import { MessageSendResponse } from "../types/whatsappWebTypes";

export class MessageSendingService {
  static async sendMessage(
    instanceId: string,
    phone: string,
    message: string
  ): Promise<MessageSendResponse> {
    try {
      console.log('[MessageSending] 📤 Enviando mensagem via edge function...');

      const { data, error } = await supabase.functions.invoke('whatsapp_send_message', {
        body: {
          instanceId,
          phone,
          message
        }
      });

      if (error) throw error;

      if (data?.success) {
        return {
          success: true,
          messageId: data.messageId,
          timestamp: data.timestamp,
          leadId: data.leadId
        };
      } else {
        throw new Error(data?.error || 'Erro desconhecido no envio');
      }

    } catch (error: any) {
      console.error('[MessageSending] ❌ Erro no envio:', error);
      return {
        success: false,
        error: error.message || 'Erro ao enviar mensagem'
      };
    }
  }
}
