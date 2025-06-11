import { supabase } from "@/integrations/supabase/client";

export class ApiClient {
  // Health check via whatsapp_instance_manager
  static async checkVPSHealth(): Promise<{ success: boolean; responseTime?: number }> {
    try {
      console.log('[ApiClient] 🔍 Health check via whatsapp_instance_manager...');
      
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'health_check'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      const isHealthy = !error && data?.success;
      
      console.log('[ApiClient] ✅ VPS Health Check BAILEYS:', { 
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

  // Criar instância via Baileys (sem Puppeteer)
  static async createInstance(userEmail?: string): Promise<any> {
    try {
      console.log('[ApiClient] 🚀 Criando instância via BAILEYS (sem Puppeteer)');
      
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
      
      console.log('[ApiClient] ✅ Instância criada via BAILEYS:', {
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

  // Obter QR Code via Baileys
  static async getQRCode(instanceId: string): Promise<any> {
    try {
      console.log('[ApiClient] 📱 Obtendo QR Code via BAILEYS:', instanceId);
      
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
      
      console.log('[ApiClient] 📥 QR Code response BAILEYS:', {
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

  // Deletar instância via Baileys
  static async deleteInstance(instanceId: string): Promise<any> {
    try {
      console.log('[ApiClient] 🗑️ Deletando instância via BAILEYS:', instanceId);
      
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
      
      console.log('[ApiClient] ✅ Instância deletada via BAILEYS');
      
      return { success: true };
      
    } catch (error: any) {
      console.error('[ApiClient] ❌ Erro ao deletar instância:', error);
      throw error;
    }
  }

  // Método para atualizar QR Code via API oficial
  static async refreshQRCode(instanceId: string): Promise<any> {
    try {
      console.log('[ApiClient] 🔄 Atualizando QR Code via BAILEYS:', instanceId);
      
      const result = await this.getQRCode(instanceId);
      
      console.log('[ApiClient] ✅ QR Code atualizado via BAILEYS');
      
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
      console.log('[ApiClient] 📤 Enviando mensagem via BAILEYS');
      
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
      
      console.log('[ApiClient] ✅ Mensagem enviada via BAILEYS');
      
      return { success: data?.success || false };
      
    } catch (error: any) {
      console.error('[ApiClient] ❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // Diagnósticos via whatsapp_instance_manager
  static async runVPSDiagnostics(): Promise<any> {
    try {
      console.log('[ApiClient] 🔧 Executando diagnósticos BAILEYS');
      
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
        source: 'baileys_server'
      };
      
    } catch (error: any) {
      console.error('[ApiClient] ❌ Erro ao executar diagnósticos:', error);
      return { success: false, error: error.message };
    }
  }

  // Método para bloquear chamadas diretas VPS - MANTIDO
  static blockDirectVPSCall(methodName: string): never {
    const errorMessage = `❌ Método ${methodName} foi BLOQUEADO. Use apenas Edge Functions via ApiClient com BAILEYS.`;
    console.error('[ApiClient] ' + errorMessage);
    throw new Error(errorMessage);
  }
}
