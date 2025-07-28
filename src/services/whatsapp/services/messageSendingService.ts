
import { supabase } from "@/integrations/supabase/client";
import { MessageSendResponse } from "../types/whatsappWebTypes";

export class MessageSendingService {
  static async sendMessage(
    instanceId: string,
    phone: string,
    message: string,
    media?: { file: File; type: string }
  ): Promise<MessageSendResponse> {
    try {
      console.log('[MessageSending] 📤 Enviando mensagem via whatsapp_messaging_service...');

      // ✅ CORREÇÃO: Usar phone diretamente para compatibilidade
      const { data, error } = await supabase.functions.invoke('whatsapp_messaging_service', {
        body: {
          action: 'send_message',
          instanceId,
          phone, // Usar phone diretamente
          message,
          mediaType: media?.type || 'text',
          mediaUrl: media ? URL.createObjectURL(media.file) : undefined
        }
      });

      if (error) {
        console.error('[MessageSending] ❌ Erro na edge function:', error);
        throw error;
      }

      if (data?.success) {
        console.log('[MessageSending] ✅ Mensagem enviada com sucesso:', data.data);
        return {
          success: true,
          messageId: data.data?.messageId,
          timestamp: data.data?.timestamp,
          leadId: data.data?.leadId || phone
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

  // ✅ CORREÇÃO: Método com retry automático usando phone
  static async sendMessageWithRetry(
    instanceId: string,
    phone: string,
    message: string,
    media?: { file: File; type: string },
    maxRetries = 3
  ): Promise<MessageSendResponse> {
    let lastError: string = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[MessageSending] 🔄 Tentativa ${attempt}/${maxRetries} para ${phone.substring(0, 4)}****`);
        
        const result = await this.sendMessage(instanceId, phone, message, media);
        
        if (result.success) {
          if (attempt > 1) {
            console.log(`[MessageSending] ✅ Sucesso na tentativa ${attempt}`);
          }
          return result;
        } else {
          lastError = result.error || 'Erro desconhecido';
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 1000; // Backoff exponencial
            console.log(`[MessageSending] ⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      } catch (error: any) {
        lastError = error.message || 'Erro na comunicação';
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`[MessageSending] ⏳ Erro na tentativa ${attempt}, aguardando ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: `Falha após ${maxRetries} tentativas: ${lastError}`
    };
  }
}
