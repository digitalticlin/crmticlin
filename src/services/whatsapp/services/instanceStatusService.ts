
import { supabase } from "@/integrations/supabase/client";
import { ServiceResponse } from "../types/whatsappWebTypes";

export class InstanceStatusService {
  static async getInstanceStatus(instanceId: string): Promise<ServiceResponse> {
    try {
      // Primeiro tenta via edge function
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'get_status',
          instanceData: {
            instanceId
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Error getting instance status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getQRCode(instanceId: string): Promise<ServiceResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'get_qr',
          instanceData: {
            instanceId
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;

    } catch (error) {
      console.error('Error getting QR code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
