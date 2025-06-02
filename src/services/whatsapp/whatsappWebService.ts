
import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppWebServiceResponse {
  success: boolean;
  instance?: any;
  qrCode?: string;
  status?: any;
  data?: any;
  error?: string;
}

export class WhatsAppWebService {
  private static async makeAuthenticatedRequest(action: string, instanceData: any): Promise<WhatsAppWebServiceResponse> {
    try {
      console.log(`WhatsApp Web Service: ${action}`, instanceData);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action,
          instanceData
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Erro na comunicação com o servidor');
      }

      console.log(`WhatsApp Web Service response:`, data);
      return data;
    } catch (error: any) {
      console.error(`WhatsApp Web Service error (${action}):`, error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido'
      };
    }
  }

  static async createInstance(instanceName: string): Promise<WhatsAppWebServiceResponse> {
    return this.makeAuthenticatedRequest('create_instance', {
      instanceName
    });
  }

  static async deleteInstance(instanceId: string): Promise<WhatsAppWebServiceResponse> {
    return this.makeAuthenticatedRequest('delete_instance', {
      instanceId
    });
  }

  static async getInstanceStatus(instanceId: string): Promise<WhatsAppWebServiceResponse> {
    return this.makeAuthenticatedRequest('get_status', {
      instanceId
    });
  }

  static async getQRCode(instanceId: string): Promise<WhatsAppWebServiceResponse> {
    return this.makeAuthenticatedRequest('get_qr_code', {
      instanceId
    });
  }

  static async checkServerHealth(): Promise<WhatsAppWebServiceResponse> {
    return this.makeAuthenticatedRequest('check_server', {});
  }
}
