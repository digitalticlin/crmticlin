
import { supabase } from "@/integrations/supabase/client";
import { 
  WhatsAppWebInstance, 
  MessageSendResponse, 
  SyncResponse, 
  ServerHealthResponse, 
  QRCodeResponse, 
  InstanceResponse,
  WhatsAppConnectionStatus
} from "./types/whatsappWebTypes";

export class WhatsAppWebService {
  static async getInstances(): Promise<WhatsAppWebInstance[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(instance => ({
        ...instance,
        connection_status: instance.connection_status as WhatsAppConnectionStatus
      }));
    } catch (error: any) {
      console.error('[WhatsAppWebService] Erro ao buscar instâncias:', error);
      return [];
    }
  }

  static async createInstance(instanceName: string): Promise<InstanceResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_create', {
        body: { instanceName }
      });

      if (error) throw error;

      return {
        success: true,
        instance: data?.instance
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao criar instância'
      };
    }
  }

  static async deleteInstance(instanceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_delete', {
        body: { instanceId }
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao deletar instância'
      };
    }
  }

  static async getQRCode(instanceId: string): Promise<QRCodeResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_qr', {
        body: { instanceId }
      });

      if (error) throw error;

      return {
        success: true,
        qrCode: data?.qrCode,
        waiting: data?.waiting
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao obter QR Code'
      };
    }
  }

  static async refreshQRCode(instanceId: string): Promise<QRCodeResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_qr', {
        body: { instanceId, refresh: true }
      });

      if (error) throw error;

      return {
        success: true,
        qrCode: data?.qrCode,
        waiting: data?.waiting
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao atualizar QR Code'
      };
    }
  }

  static async checkServerHealth(): Promise<ServerHealthResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_server_health');

      if (error) throw error;

      return {
        success: true,
        data: data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao verificar saúde do servidor'
      };
    }
  }

  static async getServerInfo(): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_server_info');

      if (error) throw error;

      return {
        success: true,
        data: data
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
      const { data, error } = await supabase.functions.invoke('whatsapp_sync_instances');

      if (error) throw error;

      return {
        success: true,
        data: data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro na sincronização'
      };
    }
  }
}
