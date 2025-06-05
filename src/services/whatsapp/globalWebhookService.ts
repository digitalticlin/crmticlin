
import { supabase } from "@/integrations/supabase/client";

export class GlobalWebhookService {
  private static readonly VPS_BASE_URL = 'http://31.97.24.222:3001';
  private static readonly VPS_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
  private static readonly WEBHOOK_URL = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';

  /**
   * Configura o webhook global na VPS para todas as instâncias
   */
  static async configureGlobalWebhook() {
    try {
      console.log('[Global Webhook] 🌐 Configurando webhook global na VPS...');

      const response = await fetch(`${this.VPS_BASE_URL}/webhook/global`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.VPS_TOKEN}`
        },
        body: JSON.stringify({
          webhookUrl: this.WEBHOOK_URL,
          events: [
            'messages.upsert',
            'connection.update',
            'qr.update',
            'ready',
            'authenticated'
          ],
          enabled: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('[Global Webhook] ✅ Webhook global configurado:', result);

      // Log da configuração no Supabase
      await supabase
        .from('sync_logs')
        .insert({
          function_name: 'global_webhook_config',
          status: 'success',
          result: {
            message: 'Webhook global configurado com sucesso',
            webhook_url: this.WEBHOOK_URL,
            vps_url: this.VPS_BASE_URL,
            timestamp: new Date().toISOString()
          }
        });

      return {
        success: true,
        message: 'Webhook global configurado com sucesso',
        result
      };

    } catch (error) {
      console.error('[Global Webhook] ❌ Erro ao configurar webhook global:', error);

      // Log do erro no Supabase
      await supabase
        .from('sync_logs')
        .insert({
          function_name: 'global_webhook_config',
          status: 'error',
          error_message: error.message,
          result: {
            webhook_url: this.WEBHOOK_URL,
            vps_url: this.VPS_BASE_URL,
            timestamp: new Date().toISOString()
          }
        });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verifica o status do webhook global
   */
  static async checkGlobalWebhookStatus() {
    try {
      console.log('[Global Webhook] 📊 Verificando status do webhook global...');

      const response = await fetch(`${this.VPS_BASE_URL}/webhook/global/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.VPS_TOKEN}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const status = await response.json();
      console.log('[Global Webhook] ✅ Status obtido:', status);

      return {
        success: true,
        status
      };

    } catch (error) {
      console.error('[Global Webhook] ❌ Erro ao verificar status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Desabilita o webhook global
   */
  static async disableGlobalWebhook() {
    try {
      console.log('[Global Webhook] 🚫 Desabilitando webhook global...');

      const response = await fetch(`${this.VPS_BASE_URL}/webhook/global`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.VPS_TOKEN}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('[Global Webhook] ✅ Webhook global desabilitado:', result);

      return {
        success: true,
        message: 'Webhook global desabilitado com sucesso',
        result
      };

    } catch (error) {
      console.error('[Global Webhook] ❌ Erro ao desabilitar webhook global:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
