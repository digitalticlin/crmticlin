
import { supabase } from "@/integrations/supabase/client";
import { VPS_CONFIG } from "../config/vpsConfig";
import { ServiceResponse } from "../types/whatsappWebTypes";

export class MessagingService {
  static async sendMessage(instanceId: string, phone: string, message: string): Promise<ServiceResponse> {
    try {
      // Get instance data from database
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('server_url, vps_instance_id')
        .eq('id', instanceId)
        .single();

      if (!instance) {
        throw new Error('Instance not found');
      }

      // Send message directly to VPS server
      const response = await fetch(`${VPS_CONFIG.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceId: instance.vps_instance_id,
          phone,
          message
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      return { success: true };

    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
