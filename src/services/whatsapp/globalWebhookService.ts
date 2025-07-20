
import { VPS_CONFIG, getEndpointUrl, getRequestHeaders } from './config/vpsConfig';

/**
 * ✅ SERVIÇO DE WEBHOOK GLOBAL MULTI-TENANT
 * Responsável por configurar webhook global na VPS para todas as empresas
 */
export class GlobalWebhookService {
  private static WEBHOOK_URL = 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_whatsapp_web';
  private static WEBHOOK_EVENTS = ['qr.update', 'messages.upsert', 'connection.update'];

  /**
   * ✅ CONFIGURAR WEBHOOK GLOBAL NA VPS
   */
  static async configureGlobalWebhook(): Promise<{
    success: boolean;
    error?: string;
    status?: any;
  }> {
    try {
      console.log('[Global Webhook] 🌐 Configurando webhook global na VPS...');

      const webhookConfig = {
        url: this.WEBHOOK_URL,
        events: this.WEBHOOK_EVENTS,
        enabled: true
      };

      const response = await fetch(getEndpointUrl('/webhook/global'), {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify(webhookConfig)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Global Webhook] ❌ Erro na configuração:', errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const result = await response.json();
      console.log('[Global Webhook] ✅ Webhook global configurado:', result);

      return {
        success: true,
        status: result
      };

    } catch (error: any) {
      console.error('[Global Webhook] ❌ Erro crítico:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * ✅ VERIFICAR STATUS DO WEBHOOK GLOBAL
   */
  static async checkGlobalWebhookStatus(): Promise<{
    success: boolean;
    error?: string;
    status?: any;
  }> {
    try {
      console.log('[Global Webhook] 🔍 Verificando status do webhook global...');

      const response = await fetch(getEndpointUrl('/webhook/global/status'), {
        method: 'GET',
        headers: getRequestHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const status = await response.json();
      console.log('[Global Webhook] 📊 Status obtido:', status);

      return {
        success: true,
        status
      };

    } catch (error: any) {
      console.error('[Global Webhook] ❌ Erro ao verificar status:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * ✅ DESABILITAR WEBHOOK GLOBAL
   */
  static async disableGlobalWebhook(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('[Global Webhook] 🚫 Desabilitando webhook global...');

      const response = await fetch(getEndpointUrl('/webhook/global'), {
        method: 'DELETE',
        headers: getRequestHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      console.log('[Global Webhook] ✅ Webhook global desabilitado');
      return { success: true };

    } catch (error: any) {
      console.error('[Global Webhook] ❌ Erro ao desabilitar:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * ✅ TESTAR WEBHOOK COM PING
   */
  static async testWebhook(): Promise<{
    success: boolean;
    error?: string;
    response?: any;
  }> {
    try {
      console.log('[Global Webhook] 🏓 Testando webhook com ping...');

      const testPayload = {
        event: 'webhook.test',
        instanceName: 'test',
        data: {
          message: 'Teste de webhook automático',
          timestamp: new Date().toISOString()
        }
      };

      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTMxMDAsImV4cCI6MjA2NjA4OTEwMH0._trCzQxDz5wCHs6NlrXRPAJNqfCRQM4s8NhkX5xEn4w'
        },
        body: JSON.stringify(testPayload)
      });

      const responseData = await response.json();
      console.log('[Global Webhook] 📥 Resposta do teste:', responseData);

      return {
        success: response.ok,
        response: responseData,
        error: response.ok ? undefined : `HTTP ${response.status}`
      };

    } catch (error: any) {
      console.error('[Global Webhook] ❌ Erro no teste:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido'
      };
    }
  }
}
