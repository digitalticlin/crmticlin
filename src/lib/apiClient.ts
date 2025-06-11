import { supabase } from "@/integrations/supabase/client";

export class ApiClient {
  // Health check via whatsapp_instance_manager
  static async checkVPSHealth(): Promise<{ success: boolean; responseTime?: number }> {
    try {
      console.log('[ApiClient] 🔍 Health check via whatsapp_instance_manager...');
      
      const startTime = Date.now();
      
      // Usar whatsapp_instance_manager para health check (sem action específica, só teste de conectividade)
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'health_check'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      // Se chegou até aqui, a edge function está respondendo
      const isHealthy = !error && responseTime < 10000;
      
      console.log('[ApiClient] ✅ VPS Health Check via whatsapp_instance_manager:', { 
        success: isHealthy, 
        responseTime: `${responseTime}ms`
      });
      
      return { 
        success: isHealthy, 
        responseTime 
      };
      
    } catch (error: any) {
      console.error('[ApiClient] ❌ Erro no health check:', error);
      return { success: false };
    }
  }

  // Método para criar instância via API oficial - MANTIDO
  static async createInstance(userEmail?: string): Promise<any> {
    try {
      console.log('[ApiClient] 🚀 Criando instância via API oficial Supabase');
      
      // Gerar nome inteligente baseado no email
      let intelligentName = 'whatsapp';
      if (userEmail) {
        intelligentName = userEmail.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      }
      
      console.log('[ApiClient] 🎯 Nome inteligente gerado:', intelligentName);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: intelligentName
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
      
      console.log('[ApiClient] ✅ Instância criada via API oficial:', {
        instanceName: intelligentName,
        instanceId: data.instance?.id,
        mode: data.mode
      });
      
      return {
        success: true,
        instance: data.instance,
        qrCode: data.qrCode || null,
        intelligent_name: intelligentName,
        mode: data.mode
      };
      
    } catch (error: any) {
      console.error('[ApiClient] ❌ Erro ao criar instância:', error);
      throw error;
    }
  }

  // Método para obter QR Code via API oficial
  static async getQRCode(instanceId: string): Promise<any> {
    try {
      console.log('[ApiClient] 📱 Obtendo QR Code via whatsapp_instance_manager:', instanceId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'get_qr_code',
          instanceId
        }
      });
      
      if (error) {
        console.error('[ApiClient] ❌ Erro do Supabase:', error);
        return { success: false, error: error.message };
      }
      
      console.log('[ApiClient] 📥 QR Code response:', {
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
      console.error('[ApiClient] ❌ Erro ao obter QR Code:', error);
      return { success: false, error: error.message };
    }
  }

  // Método para deletar instância via API oficial
  static async deleteInstance(instanceId: string): Promise<any> {
    try {
      console.log('[ApiClient] 🗑️ Deletando instância via whatsapp_instance_manager:', instanceId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'delete_instance_corrected',
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
      
      console.log('[ApiClient] ✅ Instância deletada via whatsapp_instance_manager');
      
      return { success: true };
      
    } catch (error: any) {
      console.error('[ApiClient] ❌ Erro ao deletar instância:', error);
      throw error;
    }
  }

  // Método para atualizar QR Code via API oficial
  static async refreshQRCode(instanceId: string): Promise<any> {
    try {
      console.log('[ApiClient] 🔄 Atualizando QR Code via whatsapp_instance_manager:', instanceId);
      
      // Usar o mesmo método de obter QR Code
      const result = await this.getQRCode(instanceId);
      
      console.log('[ApiClient] ✅ QR Code atualizado via whatsapp_instance_manager');
      
      return {
        success: result.success,
        data: {
          qrCode: result.data?.qrCode,
          waiting: result.data?.waiting
        },
        error: result.error
      };
      
    } catch (error: any) {
      console.error('[ApiClient] ❌ Erro ao atualizar QR Code:', error);
      return { success: false, error: error.message };
    }
  }

  // Método para verificar autenticação
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

  static async sendMessage(instanceId: string, phone: string, message: string): Promise<any> {
    try {
      console.log('[ApiClient] 📤 Enviando mensagem via Edge Function');
      
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
      
      console.log('[ApiClient] ✅ Mensagem enviada');
      
      return { success: data?.success || false };
      
    } catch (error: any) {
      console.error('[ApiClient] ❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // Diagnósticos via whatsapp_instance_manager
  static async runVPSDiagnostics(): Promise<any> {
    try {
      console.log('[ApiClient] 🔧 Executando diagnósticos via whatsapp_instance_manager');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'health_check'
        }
      });
      
      if (error) {
        console.error('[ApiClient] ❌ Erro nos diagnósticos:', error);
        return { success: false, error: error.message };
      }
      
      return {
        success: !error,
        responseTime: 'N/A',
        source: 'whatsapp_instance_manager'
      };
      
    } catch (error: any) {
      console.error('[ApiClient] ❌ Erro ao executar diagnósticos:', error);
      return { success: false, error: error.message };
    }
  }

  // Método para bloquear chamadas diretas VPS - MANTIDO
  static blockDirectVPSCall(methodName: string): never {
    const errorMessage = `❌ Método ${methodName} foi BLOQUEADO. Use apenas Edge Functions via ApiClient.`;
    console.error('[ApiClient] ' + errorMessage);
    throw new Error(errorMessage);
  }
}
