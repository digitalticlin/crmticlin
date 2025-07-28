
import { supabase } from "@/integrations/supabase/client";
import { MessageSendResponse } from "../types/whatsappWebTypes";

export class MessageSendingService {
  static async sendMessage(
    instanceId: string,
    phone: string,
    message: string,
    mediaType?: string,
    mediaUrl?: string
  ): Promise<MessageSendResponse> {
    try {
      console.log('[MessageSending] 📤 Enviando mensagem via whatsapp_messaging_service...');

      const { data, error } = await supabase.functions.invoke('whatsapp_messaging_service', {
        body: {
          action: 'send_message',
          instanceId,
          phone,
          message,
          mediaType: mediaType || 'text',
          mediaUrl: mediaUrl || null
        }
      });

      if (error) {
        console.error('[MessageSending] ❌ Erro na Edge Function:', error);
        throw error;
      }

      if (data?.success) {
        console.log('[MessageSending] ✅ Mensagem enviada com sucesso:', data);
        return {
          success: true,
          messageId: data.data?.messageId || 'unknown',
          timestamp: data.data?.timestamp || new Date().toISOString(),
          leadId: data.data?.lead_id
        };
      } else {
        console.error('[MessageSending] ❌ Falha no envio:', data);
        throw new Error(data?.error || 'Erro desconhecido no envio');
      }

    } catch (error: any) {
      console.error('[MessageSending] ❌ Erro crítico no envio:', error);
      return {
        success: false,
        error: error.message || 'Erro ao enviar mensagem'
      };
    }
  }
}
