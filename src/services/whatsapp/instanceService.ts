
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

      // CORREÇÃO: Validar autenticação antes
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      if (!instanceName || instanceName.trim().length < 3) {
        throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
      }

      const normalizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');

      console.log(`[Instance Service] 👤 Criando para usuário: ${user.id} (${user.email})`);

      // CORREÇÃO: Usar whatsapp_instance_manager com autenticação correta
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

      // CORREÇÃO: Validar autenticação antes
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      console.log(`[Instance Service] 👤 Deletando para usuário: ${user.id}`);

      // CORREÇÃO: Usar whatsapp_instance_manager com endpoint correto
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'delete_instance_corrected',
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
      // CORREÇÃO: Buscar apenas instâncias do usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('[Instance Service] ⚠️ Usuário não autenticado, retornando dados limitados');
        return {
          success: true,
          data: {
            instances: [],
            server: 'WhatsApp Modular Architecture v5.0.0 via VPS + Webhook (Sem Autenticação)'
          }
        };
      }

      const { data: instances } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('created_by_user_id', user.id) // CORREÇÃO: filtrar por usuário
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      return {
        success: true,
        data: {
          instances: instances || [],
          server: `WhatsApp Modular Architecture v5.0.0 via VPS + Webhook (Usuário: ${user.email})`
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
