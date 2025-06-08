
import { supabase } from "@/integrations/supabase/client";

interface MessagingServiceResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class MessagingService {
  static async sendMessage(instanceId: string, phone: string, message: string): Promise<MessagingServiceResponse> {
    try {
      console.log(`[Messaging Service] 📤 Enviando mensagem:`, { instanceId, phone, messageLength: message.length });

      const { data, error } = await supabase.functions.invoke('whatsapp_messaging_service', {
        body: {
          action: 'send_message',
          instanceId,
          phone: phone.replace(/\D/g, ''),
          message
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada da função');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro desconhecido no envio da mensagem');
      }

      return {
        success: true,
        messageId: data.messageId
      };

    } catch (error: any) {
      console.error(`[Messaging Service] ❌ Erro no envio:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
