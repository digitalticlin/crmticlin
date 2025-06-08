
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  instance?: any;
  qrCode?: string;
  waiting?: boolean;
  source?: string;
}

export class InstanceService {
  static async createInstance(instanceName: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[Instance Service] 🚀 Criando instância: ${instanceName}`);

      if (!instanceName || instanceName.trim().length < 3) {
        throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
      }

      const normalizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');

      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: normalizedName
        }
      });

      console.log(`[Instance Service] 📥 Response:`, data);

      if (error) {
        console.error(`[Instance Service] ❌ Edge Function error:`, error);
        throw new Error(error.message || 'Erro na chamada da função');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro desconhecido na criação da instância');
      }

      return {
        success: true,
        instance: data.instance,
        data: data.instance,
        qrCode: data.qrCode || null
      };

    } catch (error: any) {
      console.error(`[Instance Service] ❌ Erro na criação:`, error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido na criação da instância'
      };
    }
  }

  static async deleteInstance(instanceId: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[Instance Service] 🗑️ Deletando instância: ${instanceId}`);

      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'delete_instance',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada da função');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro desconhecido ao deletar');
      }

      return { success: true };

    } catch (error: any) {
      console.error(`[Instance Service] ❌ Erro ao deletar:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async getServerInfo(): Promise<WhatsAppServiceResponse> {
    try {
      const { data: instances } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      return {
        success: true,
        instances: instances || [],
        data: {
          instances: instances || [],
          server: 'WhatsApp Modular Architecture v5.0.0 via VPS + Webhook'
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
