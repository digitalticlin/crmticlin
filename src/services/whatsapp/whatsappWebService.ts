
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
      console.log(`[WhatsApp Web Service] 🚀 CORREÇÃO APLICADA: Usando whatsapp_instance_manager diretamente`);
      console.log(`[WhatsApp Web Service] 📝 Criando instância: ${instanceName}`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      if (!instanceName || instanceName.trim().length < 3) {
        throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
      }

      console.log(`[WhatsApp Web Service] 🎯 CORREÇÃO: Chamando whatsapp_instance_manager diretamente`);

      // CORREÇÃO: Usar whatsapp_instance_manager (a edge function correta)
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: instanceName.trim()
        }
      });

      if (error) {
        console.error(`[WhatsApp Web Service] ❌ CORREÇÃO: Edge Function error:`, error);
        throw new Error(error.message || 'Erro na chamada da edge function correta');
      }

      if (!data || !data.success) {
        console.error(`[WhatsApp Web Service] ❌ CORREÇÃO: Function falhou:`, data);
        throw new Error(data?.error || 'Edge function retornou erro na criação da instância');
      }

      console.log(`[WhatsApp Web Service] ✅ CORREÇÃO: Instância criada com sucesso via edge function correta:`, data);

      return {
        success: true,
        instance: data.instance,
        data: data.instance,
        qrCode: data.qrCode || null
      };

    } catch (error: any) {
      console.error(`[WhatsApp Web Service] ❌ CORREÇÃO: Erro geral:`, error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido na criação da instância'
      };
    }
  }

  static async deleteInstance(instanceId: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Web Service] 🗑️ CORREÇÃO: Deletando via whatsapp_instance_manager: ${instanceId}`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // CORREÇÃO: Usar whatsapp_instance_manager para deleção
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'delete_instance_corrected',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada da edge function');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro desconhecido ao deletar');
      }

      return { success: true };

    } catch (error: any) {
      console.error(`[WhatsApp Web Service] ❌ Erro ao deletar:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async getQRCode(instanceId: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Web Service] 🔍 CORREÇÃO: Obtendo QR via whatsapp_qr_service: ${instanceId}`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // CORREÇÃO: Usar whatsapp_qr_service (a edge function correta para QR)
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'get_qr_code',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada da edge function de QR');
      }

      if (!data || !data.success) {
        if (data?.waiting) {
          return {
            success: true,
            waiting: true,
            qrCode: null
          };
        }
        throw new Error(data?.error || 'Erro ao obter QR code');
      }

      return {
        success: true,
        qrCode: data.qrCode,
        waiting: false
      };

    } catch (error: any) {
      console.error(`[WhatsApp Web Service] ❌ Erro ao obter QR:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async refreshQRCode(instanceId: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Web Service] 🔄 CORREÇÃO: Gerando novo QR via whatsapp_qr_service: ${instanceId}`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // CORREÇÃO: Usar whatsapp_qr_service para refresh
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'refresh_qr_code',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada da edge function de QR');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro ao gerar novo QR code');
      }

      return {
        success: true,
        qrCode: data.qrCode,
        data: data
      };

    } catch (error: any) {
      console.error(`[WhatsApp Web Service] ❌ Erro ao gerar novo QR:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async getServerInfo(): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Web Service] 📊 CORREÇÃO: Obtendo info via whatsapp_instance_manager`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('[WhatsApp Web Service] ⚠️ Usuário não autenticado, retornando dados limitados');
        return {
          success: true,
          data: {
            instances: [],
            server: 'WhatsApp via Edge Functions Corretas (Sem Autenticação)'
          }
        };
      }

      // CORREÇÃO: Usar whatsapp_instance_manager para status
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'check_vps_status',
          instanceId: 'server_info'
        }
      });

      if (error) {
        console.error(`[WhatsApp Web Service] ❌ Erro ao obter status:`, error);
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
            server: `WhatsApp via Edge Functions Corretas (Fallback DB) - Usuário: ${user.email}`
          }
        };
      }

      return {
        success: true,
        data: {
          instances: data.instances || [],
          server: `WhatsApp via Edge Functions Corretas (Conectado) - Usuário: ${user.email}`
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async sendMessage(instanceId: string, phone: string, message: string): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Web Service] 📤 CORREÇÃO: Enviando mensagem via whatsapp_instance_manager:`, { instanceId, phone, messageLength: message.length });

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // CORREÇÃO: Usar whatsapp_instance_manager para envio
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'send_message',
          instanceId: instanceId,
          phone: phone.replace(/\D/g, ''),
          message: message
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada da edge function');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro ao enviar mensagem');
      }

      return {
        success: true,
        messageId: data.messageId || `msg_${Date.now()}`
      };

    } catch (error: any) {
      console.error(`[WhatsApp Web Service] ❌ Erro ao enviar mensagem:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async checkServerHealth(): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Web Service] 🩺 CORREÇÃO: Verificando saúde via whatsapp_instance_manager`);

      // CORREÇÃO: Usar whatsapp_instance_manager para health check
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'check_vps_status',
          instanceId: 'health_check'
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada da edge function');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Servidor não está saudável');
      }

      return {
        success: true,
        data: {
          status: data.vpsStatus?.online ? 'online' : 'offline',
          version: '1.0.0 (Edge Functions Corretas)',
          server: 'WhatsApp via whatsapp_instance_manager + whatsapp_qr_service',
          uptime: data.vpsStatus?.responseTime || 'N/A',
          permanentMode: true,
          activeInstances: 0
        }
      };

    } catch (error: any) {
      console.error(`[WhatsApp Web Service] ❌ Erro ao verificar saúde:`, error);
      return {
        success: false,
        error: error.message,
        data: { status: 'offline' }
      };
    }
  }

  static async syncInstances(): Promise<WhatsAppServiceResponse> {
    try {
      console.log(`[WhatsApp Web Service] 🔄 CORREÇÃO: Sincronizando via whatsapp_instance_manager`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // CORREÇÃO: Usar whatsapp_instance_manager para sync
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'sync_instance_status',
          instanceId: 'all_instances'
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada da edge function');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro ao sincronizar');
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
      console.error(`[WhatsApp Web Service] ❌ Erro ao sincronizar:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
