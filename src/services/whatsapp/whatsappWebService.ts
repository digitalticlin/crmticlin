import { supabase } from "@/integrations/supabase/client";

interface ServerHealthResponse {
  success: boolean;
  data?: {
    status: string;
    version?: string;
    server?: string;
    permanent_mode?: boolean;
    permanentMode?: boolean;
    active_instances?: number;
    activeInstances?: number;
    uptime?: string;
    port?: number;
    dockerRunning?: boolean;
    pm2Running?: boolean;
  };
  error?: string | null;
}

interface ServerInfoResponse {
  success: boolean;
  data?: {
    status?: string;
    info?: string;
    version?: string;
    server?: string;
    permanentMode?: boolean;
    autoReconnect?: boolean;
  };
  instances?: any[];
  error?: string | null;
}

export class WhatsAppWebService {
  static async createInstance(instanceName: string) {
    try {
      console.log('[WhatsApp Web Service] 🚀 Creating instance via backend:', instanceName);

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

      console.log('[WhatsApp Web Service] ✅ Instance created successfully via backend');
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

  // CORREÇÃO CRÍTICA: Método getQRCode melhorado com logs detalhados
  static async getQRCode(instanceId: string) {
    try {
      console.log('[WhatsApp Web Service] 📱 CORREÇÃO CRÍTICA - Obtendo QR code via backend:', instanceId);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('User not authenticated');
      }

      console.log('[WhatsApp Web Service] 🔐 CORREÇÃO CRÍTICA - Usuário autenticado, fazendo requisição...');

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'get_qr_code_async',
          instanceData: {
            instanceId
          }
        }
      });

      if (error) {
        console.error('[WhatsApp Web Service] ❌ CORREÇÃO CRÍTICA - Erro na função Supabase:', error);
        throw new Error(error.message);
      }

      console.log('[WhatsApp Web Service] 📊 CORREÇÃO CRÍTICA - Resposta recebida:', {
        success: data.success,
        waiting: data.waiting,
        hasQRCode: !!data.qrCode,
        source: data.source,
        savedToDatabase: data.savedToDatabase,
        errorPresent: !!data.error
      });

      if (!data.success && !data.waiting) {
        throw new Error(data.error || 'Failed to get QR code');
      }

      return {
        success: data.success,
        qrCode: data.qrCode,
        waiting: data.waiting,
        error: data.error,
        source: data.source,
        savedToDatabase: data.savedToDatabase
      };

    } catch (error) {
      console.error('[WhatsApp Web Service] ❌ CORREÇÃO CRÍTICA - Erro geral ao obter QR code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async deleteInstance(instanceId: string) {
    try {
      console.log('[WhatsApp Web Service] 🗑️ Deleting instance via backend:', instanceId);

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
      console.log('[WhatsApp Web Service] 📤 Sending message via backend:', { instanceId, phone, messageLength: message.length });

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'send_message',
          messageData: {
            instanceId,
            phone: phone.replace(/\D/g, ''),
            message
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      console.log('[WhatsApp Web Service] ✅ Message sent successfully via backend');
      return {
        success: true,
        data: {
          messageId: data.messageId,
          timestamp: data.timestamp || new Date().toISOString()
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

  static async getChatHistory(instanceId: string, leadId?: string, limit = 50, offset = 0) {
    try {
      console.log('[WhatsApp Web Service] 📚 Getting chat history via backend:', { instanceId, leadId, limit, offset });

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'get_chat_history',
          chatData: {
            instanceId,
            leadId,
            limit,
            offset
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to get chat history');
      }

      return {
        success: true,
        data: data.data
      };

    } catch (error) {
      console.error('[WhatsApp Web Service] ❌ Error getting chat history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async syncInstances() {
    try {
      console.log('[WhatsApp Web Service] 🔄 Syncing instances via backend...');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_all_instances',
          syncData: {}
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to sync instances');
      }

      return {
        success: true,
        data: data.data
      };

    } catch (error) {
      console.error('[WhatsApp Web Service] ❌ Error syncing instances:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // FASE 2.0: Métodos removidos que faziam chamadas diretas para VPS
  // Agora TUDO passa pelo backend (Edge Functions)
  
  static async checkServerHealth(): Promise<ServerHealthResponse> {
    try {
      console.log('[WhatsApp Web Service] 🏥 Checking server health via backend');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'check_server_health',
          healthData: {}
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to check server health');
      }

      return {
        success: true,
        data: {
          status: data.data?.status || 'online',
          version: data.data?.version,
          server: data.data?.server,
          permanent_mode: data.data?.permanent_mode,
          permanentMode: data.data?.permanentMode,
          active_instances: data.data?.active_instances,
          activeInstances: data.data?.activeInstances,
          uptime: data.data?.uptime,
          port: data.data?.port,
          dockerRunning: data.data?.dockerRunning,
          pm2Running: data.data?.pm2Running
        }
      };

    } catch (error) {
      console.error('[WhatsApp Web Service] ❌ Error checking server health:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getServerInfo(): Promise<ServerInfoResponse> {
    try {
      console.log('[WhatsApp Web Service] 📡 Getting server info via backend');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'get_server_info',
          infoData: {}
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: data.success,
        data: data.data || { status: 'unknown', info: 'unknown' },
        instances: data.instances || [],
        error: data.error
      };

    } catch (error) {
      console.error('[WhatsApp Web Service] ❌ Error getting server info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { status: 'error', info: 'error' }
      };
    }
  }
}
