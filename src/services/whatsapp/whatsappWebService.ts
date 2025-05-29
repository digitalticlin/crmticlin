
import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppWebInstance {
  id: string;
  instanceName: string;
  connectionType: 'web';
  serverUrl: string;
  vpsInstanceId: string;
  webStatus: string;
  connectionStatus: string;
  qrCode?: string;
  phone?: string;
  profileName?: string;
}

export class WhatsAppWebService {
  private static readonly BASE_URL = '/functions/v1/whatsapp_web_server';

  static async createInstance(instanceName: string): Promise<{
    success: boolean;
    instance?: WhatsAppWebInstance;
    error?: string;
  }> {
    try {
      console.log('Creating WhatsApp Web.js instance:', instanceName);

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'create_instance',
          instanceData: {
            instanceName
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

  static async deleteInstance(instanceId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
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

  static async getInstanceStatus(instanceId: string): Promise<{
    success: boolean;
    status?: any;
    error?: string;
  }> {
    try {
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

  static async getQRCode(instanceId: string): Promise<{
    success: boolean;
    qrCode?: string;
    error?: string;
  }> {
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

  static async sendMessage(instanceId: string, phone: string, message: string): Promise<{
    success: boolean;
    error?: string;
  }> {
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
      const response = await fetch(`${instance.server_url}/send`, {
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
