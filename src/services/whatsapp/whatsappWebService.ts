
import { supabase } from "@/integrations/supabase/client";

export class WhatsAppWebService {
  static async createInstance(instanceName: string): Promise<{
    success: boolean;
    instance?: any;
    qrCode?: string;
    error?: string;
    shouldShowModal?: boolean;
  }> {
    try {
      console.log(`[WhatsApp Web Service] 🚀 HÍBRIDO: Criando instância: ${instanceName}`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // HÍBRIDO: Usar whatsapp_instance_manager para criação assíncrona
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: instanceName
        }
      });

      console.log(`[WhatsApp Web Service] 📥 HÍBRIDO: Resposta:`, {
        success: data?.success,
        hasInstance: !!(data?.instance),
        error: data?.error || error?.message
      });

      if (error) {
        console.error(`[WhatsApp Web Service] ❌ HÍBRIDO: Edge Function error:`, error);
        throw new Error(error.message || 'Erro na chamada da edge function');
      }

      if (!data) {
        throw new Error('Resposta vazia da edge function');
      }

      if (data.success && data.instance) {
        console.log(`[WhatsApp Web Service] ✅ HÍBRIDO: Instância criada - iniciando polling:`, data.instance.id);
        
        return {
          success: true,
          instance: data.instance,
          shouldShowModal: true, // HÍBRIDO: Sinalizar para abrir modal
          qrCode: null // QR será obtido via polling
        };
      }

      throw new Error(data.error || 'Erro desconhecido ao criar instância');

    } catch (error: any) {
      console.error(`[WhatsApp Web Service] ❌ HÍBRIDO: Erro geral:`, error);
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
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'delete_instance_corrected',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao deletar instância');
      }

      return { success: true };
    } catch (error: any) {
      console.error('[WhatsApp Web Service] ❌ Erro ao deletar:', error);
      return {
        success: false,
        error: error.message || 'Erro ao deletar instância'
      };
    }
  }

  // MÉTODOS ADICIONAIS PARA COMPATIBILIDADE
  static async checkServerHealth(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch('http://31.97.24.222:3002/health');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data: {
          status: 'online',
          version: data.version || 'unknown',
          server: data.server || 'WhatsApp Server',
          permanent_mode: data.permanentMode || false,
          active_instances: data.activeInstances || 0
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

  static async getQRCode(instanceId: string): Promise<{ success: boolean; qrCode?: string; waiting?: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'get_qr_code_v3',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao buscar QR Code');
      }

      if (data?.success && data.qrCode) {
        return {
          success: true,
          qrCode: data.qrCode
        };
      }

      if (data?.waiting) {
        return {
          success: false,
          waiting: true
        };
      }

      return {
        success: false,
        error: data?.error || 'QR Code não disponível'
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
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'refresh_qr_code',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao fazer refresh do QR Code');
      }

      // Aguardar um pouco e buscar novamente
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const qrResult = await this.getQRCode(instanceId);
      
      if (qrResult.success && qrResult.qrCode) {
        return {
          success: true,
          qrCode: qrResult.qrCode
        };
      }

      return {
        success: false,
        error: 'QR Code não foi gerado após refresh'
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

  static async syncInstances(): Promise<{ success: boolean; error?: string }> {
    try {
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
        error: data?.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro na sincronização'
      };
    }
  }
}
