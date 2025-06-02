
import { supabase } from "@/integrations/supabase/client";

export class WhatsAppWebService {
  private static async makeAuthenticatedRequest(action: string, data: any) {
    console.log(`WhatsApp Web Service: ${action}`, data);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action,
          instanceData: data
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message);
      }

      if (!result.success) {
        console.error(`WhatsApp Web Service error (${action}):`, result.error);
        throw new Error(result.error || `Failed to ${action}`);
      }

      return result;
    } catch (error) {
      console.error(`WhatsApp Web Service error (${action}):`, error);
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
}
