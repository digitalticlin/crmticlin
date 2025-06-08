
import { supabase } from "@/integrations/supabase/client";

interface MessagingServiceResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class MessagingService {
  static async sendMessage(instanceId: string, phone: string, message: string): Promise<MessagingServiceResponse> {
    try {
      console.log(`[Messaging Service] 📤 CORREÇÃO: Enviando mensagem com endpoint correto:`, { instanceId, phone, messageLength: message.length });

      // CORREÇÃO: Usar whatsapp_messaging_service com endpoint correto POST /send
      const { data, error } = await supabase.functions.invoke('whatsapp_messaging_service', {
        body: {
          action: 'send_message_corrected',
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
