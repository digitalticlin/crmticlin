
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  instance?: any;
  instances?: any[];
  qrCode?: string;
  waiting?: boolean;
  source?: string;
  syncedCount?: number;
  messageId?: string;
}

export class WhatsAppWebService {
  
  // CORREÇÃO TOTAL: Método de criação via Edge Function
  static async createInstance(instanceName: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Service] 🚀 CORREÇÃO TOTAL - Criando via Edge Function: ${instanceName}`);

      if (!instanceName || instanceName.trim().length < 3) {
        throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
      }

      const normalizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'create_instance',
          instanceData: {
            instanceName: normalizedName
          }
        }
      });

      console.log(`[WhatsApp Service] 📥 Response:`, data);
      console.log(`[WhatsApp Service] ⚠️ Error:`, error);

      if (error) {
        console.error(`[WhatsApp Service] ❌ Supabase function error:`, error);
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
      console.error(`[WhatsApp Service] ❌ Erro na criação:`, error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido na criação da instância'
      };
    }
  }

  // CORREÇÃO TOTAL: Método de envio via Edge Function
  static async sendMessage(instanceId: string, phone: string, message: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Service] 📤 Enviando via Edge Function:`, { instanceId, phone, messageLength: message.length });

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'send_message',
          instanceId,
          phone: phone.replace(/\D/g, ''),
          message
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada da função');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro desconhecido no envio da mensagem');
      }

      return {
        success: true,
        messageId: data.messageId,
        data: data
      };

    } catch (error: any) {
      console.error(`[WhatsApp Service] ❌ Erro no envio:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // CORREÇÃO TOTAL: QR Code via Database (atualizado pelo webhook)
  static async getQRCode(instanceId: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Service] 📱 Obtendo QR Code para: ${instanceId}`);

      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('qr_code, connection_status, web_status, vps_instance_id')
        .eq('id', instanceId)
        .single();

      if (!instance) {
        return { success: false, error: 'Instância não encontrada' };
      }

      if (instance.qr_code && instance.qr_code.length > 10) {
        return {
          success: true,
          qrCode: instance.qr_code,
          source: 'database'
        };
      }

      // Se não tem QR Code, tentar via Edge Function
      if (instance.vps_instance_id) {
        const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
          body: {
            action: 'get_qr_code',
            instanceId: instance.vps_instance_id
          }
        });

        if (!error && data?.success && data.qrCode) {
          return {
            success: true,
            qrCode: data.qrCode,
            source: 'vps'
          };
        }
      }

      return {
        success: false,
        waiting: true,
        error: 'QR Code ainda não foi gerado'
      };

    } catch (error: any) {
      console.error(`[WhatsApp Service] ❌ Erro ao obter QR Code:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // CORREÇÃO TOTAL: Delete via Edge Function
  static async deleteInstance(instanceId: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Service] 🗑️ Deletando via Edge Function: ${instanceId}`);

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
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
      console.error(`[WhatsApp Service] ❌ Erro ao deletar:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // CORREÇÃO TOTAL: Server Info via Database
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
          server: 'WhatsApp Web.js via VPS + Supabase'
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // CORREÇÃO TOTAL: Sync via Edge Function
  static async syncInstances(): Promise<WhatsAppServiceResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_instances'
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na sincronização');
      }

      return {
        success: true,
        syncedCount: data?.syncedCount || 0,
        data: data
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        syncedCount: 0
      };
    }
  }

  // CORREÇÃO TOTAL: Health Check
  static async checkServerHealth(): Promise<WhatsAppServiceResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('vps_complete_diagnostic', {
        body: {}
      });

      if (error) {
        throw new Error(error.message || 'Erro no diagnóstico');
      }

      const isHealthy = data?.diagnostic?.summary?.overallSuccess || false;

      return {
        success: isHealthy,
        data: {
          status: isHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          diagnosticSummary: data?.diagnostic?.summary
        },
        error: isHealthy ? undefined : 'Sistema não está completamente funcional'
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
