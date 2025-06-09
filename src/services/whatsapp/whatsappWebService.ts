
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebInstance } from "@/types/whatsapp";

export class WhatsAppWebService {
  static async createInstance(instanceName: string): Promise<{
    success: boolean;
    instance?: WhatsAppWebInstance;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: instanceName
        }
      });

      if (error) {
        throw new Error(`Erro do Supabase: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido na criação da instância');
      }

      return {
        success: true,
        instance: data.instance
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async deleteInstance(instanceId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'delete_instance_corrected',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(`Erro do Supabase: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao deletar instância');
      }

      return { success: true };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async refreshQRCode(instanceId: string): Promise<{
    success: boolean;
    qrCode?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'generate_qr',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(`Erro na edge function: ${error.message}`);
      }

      if (!data?.success) {
        if (data?.waiting) {
          return {
            success: false,
            error: data.message || 'QR Code ainda sendo gerado'
          };
        }
        throw new Error(data?.error || 'Erro desconhecido ao gerar QR Code');
      }

      return {
        success: true,
        qrCode: data.qrCode
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async getQRCode(instanceId: string): Promise<{
    success: boolean;
    qrCode?: string;
    error?: string;
    waiting?: boolean;
    source?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'get_qr',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(`Erro na edge function: ${error.message}`);
      }

      if (!data?.success) {
        if (data?.waiting) {
          return {
            success: false,
            waiting: true,
            error: data.message || 'QR Code ainda sendo gerado'
          };
        }
        throw new Error(data?.error || 'Erro desconhecido ao obter QR Code');
      }

      return {
        success: true,
        qrCode: data.qrCode,
        source: data.source || 'api'
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async sendMessage(instanceId: string, phone: string, message: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_message_sender', {
        body: {
          instanceId: instanceId,
          phone: phone,
          message: message
        }
      });

      if (error) {
        throw new Error(`Erro na edge function: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao enviar mensagem');
      }

      return {
        success: true,
        messageId: data.messageId
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async checkServerHealth(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_health_check', {
        body: {
          action: 'check_server_health'
        }
      });

      if (error) {
        throw new Error(`Erro na edge function: ${error.message}`);
      }

      return {
        success: true,
        data: data
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async getServerInfo(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_server_info', {
        body: {
          action: 'get_server_info'
        }
      });

      if (error) {
        throw new Error(`Erro na edge function: ${error.message}`);
      }

      return {
        success: true,
        data: data
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async syncInstances(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_sync', {
        body: {
          action: 'sync_instances'
        }
      });

      if (error) {
        throw new Error(`Erro na edge function: ${error.message}`);
      }

      return {
        success: true,
        data: data
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
