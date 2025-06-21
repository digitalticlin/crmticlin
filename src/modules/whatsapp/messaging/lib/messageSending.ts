
import { supabase } from "@/integrations/supabase/client";

export interface SendMessageParams {
  instanceId: string;
  phone: string;
  message: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class MessageSendingService {
  static async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    try {
      console.log('[MessageSending] 📤 Enviando mensagem:', {
        instanceId: params.instanceId,
        phone: params.phone,
        messageLength: params.message.length
      });

      const { data, error } = await supabase.functions.invoke('whatsapp_messaging_service', {
        body: {
          action: 'send_message',
          instanceId: params.instanceId,
          phone: params.phone.replace(/\D/g, ''),
          message: params.message
        }
      });

      if (error) {
        console.error('[MessageSending] ❌ Erro do Supabase:', error);
        throw new Error(error.message || 'Erro na chamada da função');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro desconhecido no envio da mensagem');
      }

      console.log('[MessageSending] ✅ Mensagem enviada com sucesso');

      return {
        success: true,
        messageId: data.messageId
      };

    } catch (error: any) {
      console.error('[MessageSending] ❌ Erro no envio:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
