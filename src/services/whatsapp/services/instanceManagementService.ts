
import { supabase } from "@/integrations/supabase/client";
import { VPS_CONFIG } from "../config/vpsConfig";
import { InstanceResponse, ServiceResponse } from "../types/whatsappWebTypes";

export class InstanceManagementService {
  static async createInstance(instanceName: string): Promise<InstanceResponse> {
    try {
      console.log('Creating WhatsApp Web.js instance:', instanceName);

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'create_instance',
          instanceData: {
            instanceName,
            serverUrl: VPS_CONFIG.baseUrl
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create instance');
      }

      return {
        success: true,
        instance: data.instance
      };

    } catch (error) {
      console.error('Error creating WhatsApp Web.js instance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async deleteInstance(instanceId: string): Promise<ServiceResponse> {
    try {
      console.log('Deleting WhatsApp Web.js instance:', instanceId);

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'delete_instance',
          instanceData: {
            instanceId
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete instance');
      }

      return { success: true };

    } catch (error) {
      console.error('Error deleting WhatsApp Web.js instance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
