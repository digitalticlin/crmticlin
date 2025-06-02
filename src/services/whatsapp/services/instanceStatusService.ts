
import { supabase } from "@/integrations/supabase/client";
import { VPS_CONFIG } from "../config/vpsConfig";
import { ServiceResponse, QRCodeResponse } from "../types/whatsappWebTypes";

export class InstanceStatusService {
  static async getInstanceStatus(instanceId: string): Promise<ServiceResponse> {
    try {
      console.log('Getting WhatsApp Web.js instance status:', instanceId);

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

      if (!data.success) {
        throw new Error(data.error || 'Failed to get instance status');
      }

      return {
        success: true,
        data: data.status
      };

    } catch (error) {
      console.error('Error getting WhatsApp Web.js instance status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getQRCode(instanceId: string): Promise<QRCodeResponse> {
    try {
      console.log('Getting QR Code for WhatsApp Web.js instance:', instanceId);

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'get_qr_code',
          instanceData: {
            instanceId
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to get QR code');
      }

      return {
        success: true,
        qrCode: data.qrCode
      };

    } catch (error) {
      console.error('Error getting QR code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
