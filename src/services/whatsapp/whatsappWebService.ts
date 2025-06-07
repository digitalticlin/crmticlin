
import { supabase } from "@/integrations/supabase/client";

export class WhatsAppWebService {
  
  static async createInstance(instanceName: string) {
    console.log('[WhatsApp Service] 🚀 Criando instância:', instanceName);
    
    try {
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

      return {
        success: data.success,
        instance: data.instance,
        vpsInstanceId: data.vpsInstanceId,
        error: data.error
      };

    } catch (error: any) {
      console.error('[WhatsApp Service] ❌ Erro na criação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async getQRCode(instanceId: string) {
    console.log('[WhatsApp Service] 📱 Buscando QR Code:', instanceId);
    
    try {
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

      return {
        success: data.success,
        qrCode: data.qrCode,
        source: data.source,
        waiting: data.waiting || false,
        error: data.error
      };

    } catch (error: any) {
      console.error('[WhatsApp Service] ❌ Erro no QR Code:', error);
      return {
        success: false,
        error: error.message,
        waiting: false
      };
    }
  }

  static async deleteInstance(instanceId: string) {
    console.log('[WhatsApp Service] 🗑️ Deletando instância:', instanceId);
    
    try {
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

      return {
        success: data.success,
        message: data.message,
        error: data.error
      };

    } catch (error: any) {
      console.error('[WhatsApp Service] ❌ Erro na deleção:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async checkServerHealth() {
    console.log('[WhatsApp Service] 🔍 Verificando saúde do servidor');
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'check_server'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: data.success,
        data: data.data,
        error: data.error
      };

    } catch (error: any) {
      console.error('[WhatsApp Service] ❌ Erro na verificação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Fixed getServerInfo to return consistent structure with instances property
  static async getServerInfo() {
    console.log('[WhatsApp Service] 🔍 Buscando informações do servidor');
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'get_server_info'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: data.success,
        data: data.data,
        instances: data.instances || data.data?.instances || [],
        error: data.error
      };

    } catch (error: any) {
      console.error('[WhatsApp Service] ❌ Erro ao buscar info do servidor:', error);
      return {
        success: false,
        error: error.message,
        instances: []
      };
    }
  }

  static async sendMessage(instanceId: string, phone: string, message: string) {
    console.log('[WhatsApp Service] 💬 Enviando mensagem:', { instanceId, phone });
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'send_message',
          instanceData: {
            instanceId,
            phone,
            message
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: data.success,
        messageId: data.messageId,
        error: data.error
      };

    } catch (error: any) {
      console.error('[WhatsApp Service] ❌ Erro ao enviar mensagem:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Fixed syncInstances to return consistent structure with data property
  static async syncInstances() {
    console.log('[WhatsApp Service] 🔄 Sincronizando instâncias');
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_instances'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: data.success,
        data: {
          summary: {
            updated: data.syncedCount || 0,
            preserved: 0,
            adopted: 0,
            errors: 0
          }
        },
        syncedCount: data.syncedCount || 0,
        error: data.error
      };

    } catch (error: any) {
      console.error('[WhatsApp Service] ❌ Erro na sincronização:', error);
      return {
        success: false,
        error: error.message,
        syncedCount: 0
      };
    }
  }
}
