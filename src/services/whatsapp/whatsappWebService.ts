
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebInstance } from "@/types/whatsapp";

interface WhatsAppServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  instance?: WhatsAppWebInstance;
  qrCode?: string;
  waiting?: boolean;
  messageId?: string;
}

export class WhatsAppWebService {
  static async createInstance(instanceName: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Web Service] 🚀 CORREÇÃO VIA PROXY: Criando instância: ${instanceName}`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      if (!instanceName || instanceName.trim().length < 3) {
        throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
      }

      console.log(`[WhatsApp Web Service] 🔧 CORREÇÃO VIA PROXY: Usando hostinger_proxy para contornar limitações de rede`);

      // CORREÇÃO: Usar hostinger_proxy para contornar limitações das Edge Functions
      const { data, error } = await supabase.functions.invoke('hostinger_proxy', {
        body: {
          action: 'create_whatsapp_instance',
          instanceName: instanceName.trim(),
          userEmail: user.email,
          userId: user.id
        }
      });

      if (error) {
        console.error(`[WhatsApp Web Service] ❌ PROXY ERROR:`, error);
        throw new Error(error.message || 'Erro na chamada via proxy');
      }

      if (!data || !data.success) {
        console.error(`[WhatsApp Web Service] ❌ PROXY FAILED:`, data);
        throw new Error(data?.error || 'Proxy retornou erro na criação da instância');
      }

      console.log(`[WhatsApp Web Service] ✅ PROXY SUCCESS:`, data);

      return {
        success: true,
        instance: data.instance,
        data: data.instance,
        qrCode: data.qrCode || null
      };

    } catch (error: any) {
      console.error(`[WhatsApp Web Service] ❌ ERRO GERAL:`, error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido na criação da instância'
      };
    }
  }

  static async deleteInstance(instanceId: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Web Service] 🗑️ CORREÇÃO VIA PROXY: Deletando instância: ${instanceId}`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // CORREÇÃO: Usar hostinger_proxy para deletar instância
      const { data, error } = await supabase.functions.invoke('hostinger_proxy', {
        body: {
          action: 'delete_whatsapp_instance',
          instanceId: instanceId,
          userId: user.id
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada via proxy');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro desconhecido ao deletar via proxy');
      }

      return { success: true };

    } catch (error: any) {
      console.error(`[WhatsApp Web Service] ❌ Erro ao deletar via proxy:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async getServerInfo(): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Web Service] 📊 CORREÇÃO VIA PROXY: Obtendo info do servidor`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('[WhatsApp Web Service] ⚠️ Usuário não autenticado, retornando dados limitados');
        return {
          success: true,
          data: {
            instances: [],
            server: 'WhatsApp via SSH Proxy (Sem Autenticação)'
          }
        };
      }

      // CORREÇÃO: Usar hostinger_proxy para obter status do servidor
      const { data, error } = await supabase.functions.invoke('hostinger_proxy', {
        body: {
          action: 'get_server_status',
          userId: user.id
        }
      });

      if (error) {
        console.error(`[WhatsApp Web Service] ❌ Erro ao obter status via proxy:`, error);
        // Fallback para dados do banco
        const { data: instances } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('created_by_user_id', user.id)
          .eq('connection_type', 'web')
          .order('created_at', { ascending: false });

        return {
          success: true,
          data: {
            instances: instances || [],
            server: `WhatsApp via SSH Proxy (Fallback DB) - Usuário: ${user.email}`
          }
        };
      }

      return {
        success: true,
        data: {
          instances: data.instances || [],
          server: `WhatsApp via SSH Proxy (Conectado) - Usuário: ${user.email}`
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async refreshQRCode(instanceId: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Web Service] 🔄 CORREÇÃO VIA PROXY: Gerando QR para: ${instanceId}`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // CORREÇÃO: Usar hostinger_proxy para gerar QR
      const { data, error } = await supabase.functions.invoke('hostinger_proxy', {
        body: {
          action: 'refresh_qr_code',
          instanceId: instanceId,
          userId: user.id
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada via proxy');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro ao gerar QR via proxy');
      }

      return {
        success: true,
        qrCode: data.qrCode,
        data: data
      };

    } catch (error: any) {
      console.error(`[WhatsApp Web Service] ❌ Erro ao gerar QR via proxy:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // NOVOS MÉTODOS ADICIONADOS PARA COMPATIBILIDADE:

  static async checkServerHealth(): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Web Service] 🩺 CORREÇÃO VIA PROXY: Verificando saúde do servidor`);

      // CORREÇÃO: Usar hostinger_proxy para verificar saúde
      const { data, error } = await supabase.functions.invoke('hostinger_proxy', {
        body: {
          action: 'check_server_health'
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada via proxy');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Servidor não está saudável');
      }

      return {
        success: true,
        data: {
          status: data.status || 'online',
          version: data.version || '1.0.0',
          server: data.server || 'WhatsApp via SSH Proxy',
          uptime: data.uptime || 'N/A',
          permanentMode: data.permanentMode || true,
          activeInstances: data.activeInstances || 0
        }
      };

    } catch (error: any) {
      console.error(`[WhatsApp Web Service] ❌ Erro ao verificar saúde via proxy:`, error);
      return {
        success: false,
        error: error.message,
        data: { status: 'offline' }
      };
    }
  }

  static async getQRCode(instanceId: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Web Service] 🔍 CORREÇÃO VIA PROXY: Obtendo QR Code para: ${instanceId}`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // CORREÇÃO: Usar hostinger_proxy para obter QR
      const { data, error } = await supabase.functions.invoke('hostinger_proxy', {
        body: {
          action: 'get_qr_code',
          instanceId: instanceId,
          userId: user.id
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada via proxy');
      }

      if (!data || !data.success) {
        if (data?.waiting) {
          return {
            success: true,
            waiting: true,
            qrCode: null
          };
        }
        throw new Error(data?.error || 'Erro ao obter QR via proxy');
      }

      return {
        success: true,
        qrCode: data.qrCode,
        waiting: false
      };

    } catch (error: any) {
      console.error(`[WhatsApp Web Service] ❌ Erro ao obter QR via proxy:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async sendMessage(instanceId: string, phone: string, message: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Web Service] 📤 CORREÇÃO VIA PROXY: Enviando mensagem:`, { instanceId, phone, messageLength: message.length });

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // CORREÇÃO: Usar hostinger_proxy para enviar mensagem
      const { data, error } = await supabase.functions.invoke('hostinger_proxy', {
        body: {
          action: 'send_message',
          instanceId: instanceId,
          phone: phone.replace(/\D/g, ''),
          message: message,
          userId: user.id
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada via proxy');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro ao enviar mensagem via proxy');
      }

      return {
        success: true,
        messageId: data.messageId || `msg_${Date.now()}`
      };

    } catch (error: any) {
      console.error(`[WhatsApp Web Service] ❌ Erro ao enviar mensagem via proxy:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async syncInstances(): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Web Service] 🔄 CORREÇÃO VIA PROXY: Sincronizando instâncias`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // CORREÇÃO: Usar hostinger_proxy para sincronizar
      const { data, error } = await supabase.functions.invoke('hostinger_proxy', {
        body: {
          action: 'sync_instances',
          userId: user.id
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada via proxy');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro ao sincronizar via proxy');
      }

      return {
        success: true,
        data: {
          summary: {
            updated: data.updated || 0,
            preserved: data.preserved || 0,
            adopted: data.adopted || 0,
            errors: data.errors || 0
          },
          instances: data.instances || []
        }
      };

    } catch (error: any) {
      console.error(`[WhatsApp Web Service] ❌ Erro ao sincronizar via proxy:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
