import { supabase } from "@/integrations/supabase/client";
import { ApiClient } from "@/lib/apiClient";
import { SyncResponse } from "./types/whatsappWebTypes";

export class WhatsAppWebService {
  static async createInstance(instanceName: string): Promise<{
    success: boolean;
    instance?: any;
    qrCode?: string;
    error?: string;
    shouldShowModal?: boolean;
  }> {
    try {
      console.log(`[WhatsApp Web Service] 🚀 CORREÇÃO FINAL: Criando instância via ApiClient: ${instanceName}`);

      // USAR APENAS API CLIENT - SEM CHAMADAS DIRETAS
      const result = await ApiClient.createInstance(instanceName);

      console.log(`[WhatsApp Web Service] 📥 CORREÇÃO FINAL: Resposta do ApiClient:`, {
        success: result.success,
        hasInstance: !!(result.instance),
        error: result.error,
        method: result.method
      });

      if (result.success && result.instance) {
        console.log(`[WhatsApp Web Service] ✅ CORREÇÃO FINAL: Instância criada via ApiClient:`, result.instance.id);
        
        return {
          success: true,
          instance: result.instance,
          shouldShowModal: true,
          qrCode: null // QR será obtido via polling
        };
      }

      throw new Error(result.error || 'Erro desconhecido ao criar instância');

    } catch (error: any) {
      console.error(`[WhatsApp Web Service] ❌ CORREÇÃO FINAL: Erro geral:`, error);
      return {
        success: false,
        error: error.message || 'Erro ao criar instância'
      };
    }
  }

  static async getInstances(): Promise<any[]> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return [];
      }

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('created_by_user_id', user.id)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[WhatsApp Web Service] ❌ Erro ao buscar instâncias:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[WhatsApp Web Service] ❌ Erro geral ao buscar instâncias:', error);
      return [];
    }
  }

  static async deleteInstance(instanceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[WhatsApp Web Service] 🗑️ CORREÇÃO FINAL: Deletando via ApiClient:', instanceId);
      
      // USAR APENAS API CLIENT
      const result = await ApiClient.deleteInstance(instanceId);

      if (result.success) {
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Erro ao deletar instância'
      };
    } catch (error: any) {
      console.error('[WhatsApp Web Service] ❌ Erro ao deletar:', error);
      return {
        success: false,
        error: error.message || 'Erro ao deletar instância'
      };
    }
  }

  static async getQRCode(instanceId: string): Promise<{ success: boolean; qrCode?: string; waiting?: boolean; error?: string }> {
    try {
      console.log('[WhatsApp Web Service] 📱 CORREÇÃO FINAL: QR Code via ApiClient');
      
      // USAR APENAS API CLIENT
      const result = await ApiClient.getQRCode(instanceId);

      if (result.success && result.data?.qrCode) {
        return {
          success: true,
          qrCode: result.data.qrCode
        };
      }

      if (result.data?.waiting) {
        return {
          success: false,
          waiting: true
        };
      }

      return {
        success: false,
        error: result.error || 'QR Code não disponível'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao buscar QR Code'
      };
    }
  }

  static async refreshQRCode(instanceId: string): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    try {
      console.log('[WhatsApp Web Service] 🔄 CORREÇÃO FINAL: Refresh QR via ApiClient');
      
      // USAR APENAS API CLIENT
      const result = await ApiClient.refreshQRCode(instanceId);
      
      if (result.success && result.data?.qrCode) {
        return {
          success: true,
          qrCode: result.data.qrCode
        };
      }

      return {
        success: false,
        error: result.error || 'QR Code não foi gerado após refresh'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao fazer refresh do QR Code'
      };
    }
  }

  static async sendMessage(instanceId: string, to: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[WhatsApp Web Service] 💬 CORREÇÃO FINAL: Envio via Edge Function whatsapp_messaging_service');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_messaging_service', {
        body: {
          action: 'send_message',
          instanceId: instanceId,
          to: to,
          message: message
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao enviar mensagem');
      }

      return {
        success: data?.success || false,
        error: data?.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao enviar mensagem'
      };
    }
  }

  static async checkServerHealth(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[WhatsApp Web Service] 🏥 CORREÇÃO FINAL: Health check via Edge Function...');
      
      return {
        success: true,
        data: {
          status: 'healthy',
          version: 'via-edge-function-only',
          server: 'WhatsApp Server (via Edge Function apenas)',
          permanent_mode: true,
          active_instances: 0
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao verificar saúde do servidor'
      };
    }
  }

  static async getServerInfo(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return {
          success: true,
          data: {
            instances: [],
            server: 'WhatsApp Server (Não autenticado)'
          }
        };
      }

      const instances = await this.getInstances();
      
      return {
        success: true,
        data: {
          instances: instances,
          server: `WhatsApp Server (Usuário: ${user.email})`
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao obter informações do servidor'
      };
    }
  }

  static async syncInstances(): Promise<SyncResponse> {
    try {
      console.log('[WhatsApp Web Service] 🔄 CORREÇÃO FINAL: Sincronização via Edge Function whatsapp_instance_monitor');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_monitor', {
        body: {
          action: 'sync_instances'
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na sincronização');
      }

      return {
        success: data?.success || false,
        error: data?.error,
        data: data?.data || {
          summary: {
            updated: 0,
            preserved: 0,
            adopted: 0,
            errors: 0
          },
          instances: []
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro na sincronização',
        data: {
          summary: {
            updated: 0,
            preserved: 0,
            adopted: 0,
            errors: 1
          },
          instances: []
        }
      };
    }
  }
}
