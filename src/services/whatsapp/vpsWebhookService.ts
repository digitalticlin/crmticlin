
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export class VPSWebhookService {
  private static readonly VPS_BASE_URL = 'http://31.97.24.222:3001';
  private static readonly VPS_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
  private static readonly WEBHOOK_URL = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/whatsapp_qr_service';

  /**
   * Verificar se a VPS suporta webhooks
   */
  static async checkWebhookSupport() {
    try {
      console.log('[VPS Webhook] 🔍 Verificando suporte a webhooks...');

      const response = await fetch(`${this.VPS_BASE_URL}/webhook/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.VPS_TOKEN}`
        }
      });

      const result = await response.json();
      console.log('[VPS Webhook] 📊 Suporte a webhooks:', result);

      return {
        supported: response.ok,
        status: result,
        message: response.ok ? 'Webhooks suportados' : 'Webhooks não suportados'
      };

    } catch (error) {
      console.error('[VPS Webhook] ❌ Erro ao verificar suporte:', error);
      return {
        supported: false,
        error: error.message,
        message: 'Erro ao verificar suporte a webhooks'
      };
    }
  }

  /**
   * Configurar webhook para uma instância específica
   */
  static async configureInstanceWebhook(vpsInstanceId: string) {
    try {
      console.log(`[VPS Webhook] 🔧 Configurando webhook para: ${vpsInstanceId}`);

      const webhookConfig = {
        url: this.WEBHOOK_URL,
        events: ['qr.update', 'qr.ready', 'connection.update'],
        instanceId: vpsInstanceId
      };

      const response = await fetch(`${this.VPS_BASE_URL}/instance/${vpsInstanceId}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.VPS_TOKEN}`
        },
        body: JSON.stringify(webhookConfig)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`[VPS Webhook] ✅ Webhook configurado:`, result);

      return {
        success: true,
        result,
        message: 'Webhook configurado com sucesso'
      };

    } catch (error) {
      console.error(`[VPS Webhook] ❌ Erro ao configurar webhook:`, error);
      return {
        success: false,
        error: error.message,
        message: 'Falha ao configurar webhook'
      };
    }
  }

  /**
   * Configurar webhook global para todas as instâncias
   */
  static async configureGlobalWebhook() {
    try {
      console.log('[VPS Webhook] 🌐 Configurando webhook global...');

      const response = await fetch(`${this.VPS_BASE_URL}/webhook/global`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.VPS_TOKEN}`
        },
        body: JSON.stringify({
          url: this.WEBHOOK_URL,
          events: ['qr.update', 'qr.ready', 'connection.update']
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('[VPS Webhook] ✅ Webhook global configurado:', result);

      return {
        success: true,
        result,
        message: 'Webhook global configurado com sucesso'
      };

    } catch (error) {
      console.error('[VPS Webhook] ❌ Erro ao configurar webhook global:', error);
      return {
        success: false,
        error: error.message,
        message: 'Falha ao configurar webhook global'
      };
    }
  }
}
