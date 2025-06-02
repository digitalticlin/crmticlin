import { supabase } from "@/integrations/supabase/client";
import { MessageSendingService } from "./services/messageSendingService";

export class WhatsAppWebService {
  private static async makeAuthenticatedRequest(action: string, data: any) {
    const startTime = Date.now();
    console.log(`[WhatsApp Web Service] 🚀 Iniciando ${action}:`, {
      action,
      data: { ...data, timestamp: new Date().toISOString() }
    });
    
    try {
      const { data: result, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action,
          instanceData: data
        }
      });

      const duration = Date.now() - startTime;
      
      if (error) {
        console.error(`[WhatsApp Web Service] ❌ Erro Supabase (${action}):`, {
          error,
          duration: `${duration}ms`,
          action
        });
        throw new Error(error.message);
      }

      if (!result.success) {
        console.error(`[WhatsApp Web Service] ❌ Falha na operação (${action}):`, {
          error: result.error,
          duration: `${duration}ms`,
          action,
          result
        });
        throw new Error(result.error || `Failed to ${action}`);
      }

      console.log(`[WhatsApp Web Service] ✅ Sucesso (${action}):`, {
        duration: `${duration}ms`,
        action,
        hasQrCode: action === 'get_qr_code' ? !!result.qrCode : undefined,
        permanentMode: result.permanent_mode || false,
        autoReconnect: result.auto_reconnect || false,
        instanceId: data.instanceId || data.instanceName
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[WhatsApp Web Service] 💥 Erro inesperado (${action}):`, {
        error: error instanceof Error ? error.message : error,
        duration: `${duration}ms`,
        action,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  static async createInstance(instanceName: string) {
    return this.makeAuthenticatedRequest('create_instance', {
      instanceName
    });
  }

  static async deleteInstance(instanceId: string) {
    return this.makeAuthenticatedRequest('delete_instance', {
      instanceId
    });
  }

  static async getQRCode(instanceId: string) {
    return this.makeAuthenticatedRequest('get_qr_code', {
      instanceId
    });
  }

  static async getStatus(instanceId: string) {
    return this.makeAuthenticatedRequest('get_status', {
      instanceId
    });
  }

  static async checkServerHealth() {
    return this.makeAuthenticatedRequest('check_server', {});
  }

  static async getServerInfo() {
    return this.makeAuthenticatedRequest('get_server_info', {});
  }

  static async syncInstances() {
    return this.makeAuthenticatedRequest('sync_instances', {});
  }

  static async sendMessage(instanceId: string, phone: string, message: string) {
    console.log('[WhatsApp Web Service] 📤 Sending message:', {
      instanceId,
      phone,
      messageLength: message.length
    });

    return MessageSendingService.sendMessage(instanceId, phone, message);
  }
}
