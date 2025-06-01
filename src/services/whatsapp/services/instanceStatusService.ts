
import { supabase } from "@/integrations/supabase/client";
import { ServiceResponse } from "../types/whatsappWebTypes";

export class InstanceStatusService {
  static async getInstanceStatus(instanceId: string): Promise<ServiceResponse> {
    try {
      console.log('[InstanceStatusService] Getting status for instance:', instanceId);
      
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
        console.error('[InstanceStatusService] Edge function error:', error);
        throw new Error(error.message);
      }

      console.log('[InstanceStatusService] Status response:', data);
      return data;

    } catch (error) {
      console.error('[InstanceStatusService] Error getting instance status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getQRCode(instanceId: string): Promise<ServiceResponse> {
    try {
      console.log('[InstanceStatusService] Getting QR code for instance:', instanceId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'get_qr',
          instanceData: {
            instanceId
          }
        }
      });

      if (error) {
        console.error('[InstanceStatusService] QR code error:', error);
        throw new Error(error.message);
      }

      console.log('[InstanceStatusService] QR code response:', data);
      return data;

    } catch (error) {
      console.error('[InstanceStatusService] Error getting QR code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async syncInstanceStatus(vpsInstanceId: string): Promise<ServiceResponse> {
    try {
      console.log('[InstanceStatusService] Syncing instance status:', vpsInstanceId);
      
      // Verifica status direto no VPS
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_status',
          instanceData: {
            vpsInstanceId
          }
        }
      });

      if (error) {
        console.error('[InstanceStatusService] Sync error:', error);
        throw new Error(error.message);
      }

      console.log('[InstanceStatusService] Sync response:', data);
      return data;

    } catch (error) {
      console.error('[InstanceStatusService] Error syncing status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
