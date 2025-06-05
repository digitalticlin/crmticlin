
import { supabase } from "@/integrations/supabase/client";

export class WebhookConfigService {
  private static readonly WEBHOOK_URL = `https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/whatsapp_web_server`;

  static async configureWebhookForInstance(instanceId: string) {
    console.log('[Webhook Config] 🔧 Configurando webhook para instância:', instanceId);
    
    try {
      // Configurar webhook via Edge Function
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'configure_webhook',
          instanceData: {
            instanceId,
            webhookUrl: this.WEBHOOK_URL
          }
        }
      });

      if (error) {
        console.error('[Webhook Config] ❌ Erro ao configurar webhook:', error);
        throw error;
      }

      console.log('[Webhook Config] ✅ Webhook configurado com sucesso');
      return data;
    } catch (error) {
      console.error('[Webhook Config] ❌ Erro inesperado:', error);
      throw error;
    }
  }

  static async removeWebhookForInstance(instanceId: string) {
    console.log('[Webhook Config] 🗑️ Removendo webhook para instância:', instanceId);
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'remove_webhook',
          instanceData: {
            instanceId
          }
        }
      });

      if (error) {
        console.error('[Webhook Config] ❌ Erro ao remover webhook:', error);
        throw error;
      }

      console.log('[Webhook Config] ✅ Webhook removido com sucesso');
      return data;
    } catch (error) {
      console.error('[Webhook Config] ❌ Erro inesperado:', error);
      throw error;
    }
  }
}
