
import { supabase } from "@/integrations/supabase/client";

export class ApiClient {
  // CORREÇÃO FINAL: Método para verificar saúde do VPS
  static async checkVPSHealth(): Promise<{ success: boolean; responseTime?: number }> {
    try {
      console.log('[ApiClient] 🔍 Verificando saúde do VPS corrigido...');
      
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'health_check'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        console.error('[ApiClient] ❌ Erro na verificação de saúde:', error);
        return { success: false };
      }
      
      console.log('[ApiClient] ✅ VPS Health Check:', { 
        success: data?.success, 
        responseTime: `${responseTime}ms` 
      });
      
      return { 
        success: data?.success || false, 
        responseTime 
      };
      
    } catch (error: any) {
      console.error('[ApiClient] ❌ Erro na verificação de saúde:', error);
      return { success: false };
    }
  }

  // CORREÇÃO FINAL: Método otimizado para criar instância
  static async createInstance(userEmail?: string): Promise<any> {
    try {
      console.log('[ApiClient] 🚀 CORREÇÃO FINAL: Criando instância via Edge Function para VPS corrigido');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance'
        }
      });
      
      if (error) {
        console.error('[ApiClient] ❌ Erro do Supabase:', error);
        throw new Error(error.message);
      }
      
      if (!data?.success) {
        console.error('[ApiClient] ❌ Falha na criação:', data?.error);
        throw new Error(data?.error || 'Falha ao criar instância');
      }
      
      console.log('[ApiClient] ✅ CORREÇÃO FINAL: Instância criada com VPS corrigido:', data);
      
      return {
        success: true,
        instance: data.instance,
        qrCode: data.qrCode
      };
      
    } catch (error: any) {
      console.error('[ApiClient] ❌ CORREÇÃO FINAL: Erro ao criar instância:', error);
      throw error;
    }
  }

  // CORREÇÃO FINAL: Método para obter QR Code
  static async getQRCode(instanceId: string): Promise<any> {
    try {
      console.log('[ApiClient] 📱 CORREÇÃO FINAL: Obtendo QR Code via Edge Function para VPS corrigido:', instanceId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'get_qr_code',
          instanceId
        }
      });
      
      if (error) {
        console.error('[ApiClient] ❌ Erro do Supabase:', error);
        return { success: false, error: error.message };
      }
      
      console.log('[ApiClient] 📥 CORREÇÃO FINAL: QR Code response:', {
        success: data?.success,
        hasQrCode: !!data?.qrCode,
        waiting: data?.waiting
      });
      
      return {
        success: data?.success || false,
        data: {
          qrCode: data?.qrCode,
          waiting: data?.waiting
        },
        error: data?.error
      };
      
    } catch (error: any) {
      console.error('[ApiClient] ❌ CORREÇÃO FINAL: Erro ao obter QR Code:', error);
      return { success: false, error: error.message };
    }
  }

  // CORREÇÃO FINAL: Método para deletar instância
  static async deleteInstance(instanceId: string): Promise<any> {
    try {
      console.log('[ApiClient] 🗑️ CORREÇÃO FINAL: Deletando instância via Edge Function:', instanceId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'delete_instance',
          instanceId
        }
      });
      
      if (error) {
        console.error('[ApiClient] ❌ Erro do Supabase:', error);
        throw new Error(error.message);
      }
      
      if (!data?.success) {
        console.error('[ApiClient] ❌ Falha na deleção:', data?.error);
        throw new Error(data?.error || 'Falha ao deletar instância');
      }
      
      console.log('[ApiClient] ✅ CORREÇÃO FINAL: Instância deletada com VPS corrigido');
      
      return { success: true };
      
    } catch (error: any) {
      console.error('[ApiClient] ❌ CORREÇÃO FINAL: Erro ao deletar instância:', error);
      throw error;
    }
  }

  // CORREÇÃO FINAL: Método para atualizar QR Code
  static async refreshQRCode(instanceId: string): Promise<any> {
    try {
      console.log('[ApiClient] 🔄 CORREÇÃO FINAL: Atualizando QR Code via Edge Function:', instanceId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'refresh_qr_code',
          instanceId
        }
      });
      
      if (error) {
        console.error('[ApiClient] ❌ Erro do Supabase:', error);
        return { success: false, error: error.message };
      }
      
      console.log('[ApiClient] ✅ CORREÇÃO FINAL: QR Code atualizado com VPS corrigido');
      
      return {
        success: data?.success || false,
        qrCode: data?.qrCode,
        error: data?.error
      };
      
    } catch (error: any) {
      console.error('[ApiClient] ❌ CORREÇÃO FINAL: Erro ao atualizar QR Code:', error);
      return { success: false, error: error.message };
    }
  }

  // CORREÇÃO FINAL: Método para verificar autenticação
  static async checkAuth(): Promise<{ authenticated: boolean; user?: any }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return { authenticated: false };
      }
      
      return { authenticated: true, user };
      
    } catch (error: any) {
      console.error('[ApiClient] ❌ Erro na verificação de autenticação:', error);
      return { authenticated: false };
    }
  }

  // CORREÇÃO FINAL: Método para enviar mensagem
  static async sendMessage(instanceId: string, phone: string, message: string): Promise<any> {
    try {
      console.log('[ApiClient] 📤 CORREÇÃO FINAL: Enviando mensagem via Edge Function');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_messaging_service', {
        body: {
          action: 'send_message',
          instanceId,
          phone,
          message
        }
      });
      
      if (error) {
        console.error('[ApiClient] ❌ Erro do Supabase:', error);
        throw new Error(error.message);
      }
      
      console.log('[ApiClient] ✅ CORREÇÃO FINAL: Mensagem enviada com VPS corrigido');
      
      return { success: data?.success || false };
      
    } catch (error: any) {
      console.error('[ApiClient] ❌ CORREÇÃO FINAL: Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // CORREÇÃO FINAL: Método para bloquear chamadas diretas VPS
  static blockDirectVPSCall(methodName: string): never {
    const errorMessage = `❌ CORREÇÃO FINAL: Método ${methodName} foi BLOQUEADO. Use apenas Edge Functions via ApiClient.`;
    console.error('[ApiClient] ' + errorMessage);
    throw new Error(errorMessage);
  }
}
