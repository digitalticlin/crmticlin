
import { InstanceService } from './instanceService';
import { QRCodeService } from './qrCodeService';
import { MessagingService } from './messagingService';
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  instance?: any;
  instances?: any[];
  qrCode?: string;
  waiting?: boolean;
  source?: string;
  syncedCount?: number;
  messageId?: string;
}

export class WhatsAppWebService {
  
  static async createInstance(instanceName: string): Promise<WhatsAppServiceResponse> {
    return InstanceService.createInstance(instanceName);
  }

  static async generateQRCode(instanceId: string): Promise<WhatsAppServiceResponse> {
    return QRCodeService.generateQRCode(instanceId);
  }

  static async sendMessage(instanceId: string, phone: string, message: string): Promise<WhatsAppServiceResponse> {
    return MessagingService.sendMessage(instanceId, phone, message);
  }

  static async getQRCode(instanceId: string): Promise<WhatsAppServiceResponse> {
    return QRCodeService.getQRCode(instanceId);
  }

  static async deleteInstance(instanceId: string): Promise<WhatsAppServiceResponse> {
    return InstanceService.deleteInstance(instanceId);
  }

  static async getServerInfo(): Promise<WhatsAppServiceResponse> {
    return InstanceService.getServerInfo();
  }

  static async syncInstances(): Promise<WhatsAppServiceResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_diagnostic_service', {
        body: {
          action: 'sync_instances'
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na sincronização');
      }

      return {
        success: true,
        syncedCount: data?.syncedCount || 0,
        data: data
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        syncedCount: 0
      };
    }
  }

  static async checkServerHealth(): Promise<WhatsAppServiceResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_diagnostic_service', {
        body: {
          action: 'health_check'
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro no diagnóstico');
      }

      const isHealthy = data?.success || false;

      return {
        success: isHealthy,
        data: {
          status: isHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          diagnosticSummary: data?.summary,
          architecture: 'Modular Edge Functions v5.0.0'
        },
        error: isHealthy ? undefined : 'Sistema não está completamente funcional'
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
