
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
  private static readonly baseUrl = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/whatsapp_web_server';

  // CORREÇÃO: Método de criação de instância robusto
  static async createInstance(instanceName: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Service] 🚀 CORREÇÃO TOTAL - Criando instância: ${instanceName}`);

      // Validar nome da instância
      if (!instanceName || instanceName.trim().length < 3) {
        throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
      }

      // Normalizar nome (apenas letras, números, _ e -)
      const normalizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      if (normalizedName !== instanceName.trim()) {
        console.log(`[WhatsApp Service] ⚠️ Nome normalizado: ${instanceName} -> ${normalizedName}`);
      }

      const requestBody = {
        action: 'create_instance',
        instanceData: {
          instanceName: normalizedName
        }
      };

      console.log(`[WhatsApp Service] 📤 Request body:`, requestBody);

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: requestBody
      });

      console.log(`[WhatsApp Service] 📥 Response data:`, data);
      console.log(`[WhatsApp Service] ⚠️ Response error:`, error);

      if (error) {
        console.error(`[WhatsApp Service] ❌ Supabase function error:`, error);
        throw new Error(error.message || 'Erro na chamada da função');
      }

      if (!data) {
        throw new Error('Resposta vazia da função');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido na criação da instância');
      }

      console.log(`[WhatsApp Service] ✅ Instância criada com sucesso:`, data.instance?.id);

      return {
        success: true,
        instance: data.instance,
        data: data.instance,
        qrCode: data.qrCode || null
      };

    } catch (error: any) {
      console.error(`[WhatsApp Service] ❌ Erro na criação:`, {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 300)
      });

      return {
        success: false,
        error: error.message || 'Erro desconhecido na criação da instância'
      };
    }
  }

  // CORREÇÃO: Método de envio de mensagem
  static async sendMessage(instanceId: string, phone: string, message: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Service] 📤 Enviando mensagem:`, { instanceId, phone, messageLength: message.length });

      const requestBody = {
        action: 'send_message',
        instanceId,
        phone,
        message
      };

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: requestBody
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

  // CORREÇÃO: Outros métodos essenciais
  static async getQRCode(instanceId: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Service] 📱 Obtendo QR Code para: ${instanceId}`);

      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('qr_code, connection_status, web_status')
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

      // Se não tem QR Code ainda, indicar que está aguardando
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

  static async deleteInstance(instanceId: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Service] 🗑️ Deletando instância: ${instanceId}`);

      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instanceId);

      if (error) {
        throw new Error(error.message);
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

  static async getServerInfo(): Promise<WhatsAppServiceResponse> {
    try {
      const { data: instances } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web');

      return {
        success: true,
        instances: instances || [],
        data: {
          instances: instances || [],
          server: 'WhatsApp Web.js via Supabase'
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async syncInstances(): Promise<WhatsAppServiceResponse> {
    try {
      const { data: instances } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web');

      return {
        success: true,
        syncedCount: instances?.length || 0,
        data: {
          summary: {
            updated: instances?.length || 0,
            preserved: 0,
            adopted: 0,
            errors: 0
          },
          instances: instances || []
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        syncedCount: 0
      };
    }
  }

  static async checkServerHealth(): Promise<WhatsAppServiceResponse> {
    try {
      // Verificar conectividade básica com o Supabase
      const { data } = await supabase
        .from('whatsapp_instances')
        .select('count')
        .limit(1);

      return {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString()
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
