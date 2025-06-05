
import { supabase } from "@/integrations/supabase/client";

export class WhatsAppWebService {
  static async createInstance(instanceName: string) {
    try {
      console.log('[WhatsApp Web Service] 🚀 Creating instance:', instanceName);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'create_instance',
          instanceData: {
            instanceName
          }
        }
      });

      if (error) {
        console.error('[WhatsApp Web Service] ❌ Supabase function error:', error);
        throw new Error(error.message);
      }

      if (!data.success) {
        console.error('[WhatsApp Web Service] ❌ Function returned error:', data.error);
        throw new Error(data.error || 'Failed to create instance');
      }

      console.log('[WhatsApp Web Service] ✅ Instance created successfully');
      return {
        success: true,
        instance: data.instance
      };

    } catch (error) {
      console.error('[WhatsApp Web Service] ❌ Error creating instance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getQRCode(instanceId: string) {
    try {
      console.log('[WhatsApp Web Service] 📱 Getting QR code for:', instanceId);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'get_qr_code_async',
          instanceData: {
            instanceId
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success && !data.waiting) {
        throw new Error(data.error || 'Failed to get QR code');
      }

      return {
        success: data.success,
        qrCode: data.qrCode,
        waiting: data.waiting,
        error: data.error
      };

    } catch (error) {
      console.error('[WhatsApp Web Service] ❌ Error getting QR code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async deleteInstance(instanceId: string) {
    try {
      console.log('[WhatsApp Web Service] 🗑️ Deleting instance:', instanceId);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('User not authenticated');
      }

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
      console.error('[WhatsApp Web Service] ❌ Error deleting instance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async sendMessage(instanceId: string, phone: string, message: string) {
    try {
      console.log('[WhatsApp Web Service] 📤 Sending message:', { instanceId, phone, messageLength: message.length });

      // Get instance data
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('vps_instance_id, company_id')
        .eq('id', instanceId)
        .single();

      if (!instance || !instance.vps_instance_id) {
        throw new Error('Instance not found or not connected');
      }

      // Send to VPS directly
      const response = await fetch('http://31.97.24.222:3001/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer default-token'
        },
        body: JSON.stringify({
          instanceId: instance.vps_instance_id,
          phone: phone.replace(/\D/g, ''),
          message
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`VPS send failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'VPS returned success: false');
      }

      console.log('[WhatsApp Web Service] ✅ Message sent successfully');
      return {
        success: true,
        data: {
          messageId: result.messageId,
          timestamp: result.timestamp || new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('[WhatsApp Web Service] ❌ Error sending message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
