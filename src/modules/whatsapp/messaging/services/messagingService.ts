import { supabase } from "@/integrations/supabase/client";
import { SendMessageParams, SendMessageResult, MessagingServiceConfig } from '../types/messaging';

/**
 * ✅ SERVIÇO LIMPO DE MESSAGING - ISOLADO E SIMPLIFICADO
 * Responsável por enviar mensagens via Edge Function whatsapp_messaging_service
 * Conecta com VPS 31.97.163.57:3001
 */
export class MessagingService {
  private static config: MessagingServiceConfig = {
    edgeFunctionName: 'whatsapp_messaging_service',
    timeout: 30000,
    retries: 1
  };

  /**
   * ✅ FUNÇÃO PRINCIPAL: Enviar mensagem via Edge Function
   */
  static async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    try {
      console.log('[Messaging Service] 📤 Iniciando envio de mensagem:', {
        instanceId: params.instanceId,
        phone: params.phone?.substring(0, 4) + '****',
        messageLength: params.message?.length,
        mediaType: params.mediaType || 'text',
        hasMediaUrl: !!params.mediaUrl
      });

      // ✅ VALIDAÇÃO RÁPIDA DE PARÂMETROS
      if (!params.instanceId || !params.phone || !params.message) {
        return {
          success: false,
          error: 'Parâmetros obrigatórios: instanceId, phone, message'
        };
      }

      // ✅ PREPARAR DADOS PARA EDGE FUNCTION
      const cleanPhone = params.phone.replace(/\D/g, ''); // Remover caracteres não numéricos
      const cleanMessage = params.message.trim();

      if (cleanPhone.length < 10) {
        return {
          success: false,
          error: 'Número de telefone inválido'
        };
      }

      if (cleanMessage.length === 0) {
        return {
          success: false,
          error: 'Mensagem não pode estar vazia'
        };
      }

      console.log('[Messaging Service] 🚀 Chamando Edge Function:', {
        edgeFunction: this.config.edgeFunctionName,
        instanceId: params.instanceId,
        phone: cleanPhone.substring(0, 4) + '****',
        messageLength: cleanMessage.length,
        mediaType: params.mediaType || 'text'
      });

      // ✅ CHAMAR EDGE FUNCTION COM TIMEOUT E MÍDIA
      const { data, error } = await supabase.functions.invoke(
        this.config.edgeFunctionName, 
        {
          body: {
            action: 'send_message',
            instanceId: params.instanceId,
            phone: cleanPhone,
            message: cleanMessage,
            mediaType: params.mediaType || 'text',  // ✅ NOVO: TIPO DE MÍDIA
            mediaUrl: params.mediaUrl || null       // ✅ NOVO: URL DE MÍDIA
          }
        }
      );

      // ✅ TRATAMENTO DE ERRO DA EDGE FUNCTION
      if (error) {
        console.error('[Messaging Service] ❌ Erro na Edge Function:', error);
        return {
          success: false,
          error: error.message || 'Erro na comunicação com o servidor'
        };
      }

      // ✅ VERIFICAÇÃO DE RESPOSTA
      if (!data) {
        console.error('[Messaging Service] ❌ Resposta vazia da Edge Function');
        return {
          success: false,
          error: 'Resposta vazia do servidor'
        };
      }

      if (!data.success) {
        console.error('[Messaging Service] ❌ Edge Function retornou erro:', data);
        return {
          success: false,
          error: data.error || 'Erro desconhecido no envio'
        };
      }

      console.log('[Messaging Service] ✅ Mensagem enviada com sucesso:', {
        success: data.success,
        method: data.method,
        messageId: data.data?.messageId,
        vpsInstanceId: data.vpsInstanceId,
        user: data.user
      });

      // ✅ RESPOSTA PADRONIZADA DE SUCESSO
      return {
        success: true,
        messageId: data.data?.messageId || 'unknown',
        timestamp: data.data?.timestamp || new Date().toISOString()
      };

    } catch (error: any) {
      console.error('[Messaging Service] ❌ Erro crítico no envio:', error);
      
      return {
        success: false,
        error: error.message || 'Erro crítico ao enviar mensagem'
      };
    }
  }

  /**
   * ✅ VALIDAR SE PARÂMETROS ESTÃO CORRETOS
   */
  static validateParams(params: SendMessageParams): boolean {
    return !!(
      params.instanceId && 
      params.phone && 
      params.message &&
      params.phone.replace(/\D/g, '').length >= 10 &&
      params.message.trim().length > 0
    );
  }
} 