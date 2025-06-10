
import { supabase } from "@/integrations/supabase/client";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  instance?: any;
  operationId?: string;
  method?: string;
}

class ApiClient {
  // MÉTODO CENTRALIZADO PARA CRIAR INSTÂNCIA
  static async createInstance(userEmail: string): Promise<ApiResponse> {
    try {
      console.log('[API Client] 🚀 Criando instância via Edge Function para:', userEmail);
      
      // SEMPRE usar a Edge Function - NUNCA VPS direto
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance'
          // Email será obtido do token do usuário autenticado
        }
      });

      console.log('[API Client] 📥 Resposta da Edge Function:', {
        success: data?.success,
        hasInstance: !!(data?.instance),
        error: data?.error || error?.message,
        method: data?.method
      });

      if (error) {
        console.error('[API Client] ❌ Erro da Edge Function:', error);
        throw new Error(`Edge Function error: ${error.message}`);
      }

      if (data && data.success) {
        console.log('[API Client] ✅ Instância criada via Edge Function!');
        console.log('[API Client] 🎯 Nome inteligente:', data.intelligent_name);
        console.log('[API Client] 🆔 Operation ID:', data.operationId);
        
        return {
          success: true,
          instance: data.instance,
          operationId: data.operationId,
          method: data.method || 'EDGE_FUNCTION_ONLY'
        };
      }

      throw new Error(data?.error || 'Edge Function retornou erro');

    } catch (error: any) {
      console.error('[API Client] ❌ Erro na criação:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao criar instância'
      };
    }
  }

  // MÉTODO CENTRALIZADO PARA DELETAR INSTÂNCIA
  static async deleteInstance(instanceId: string): Promise<ApiResponse> {
    try {
      console.log('[API Client] 🗑️ Deletando instância via Edge Function:', instanceId);
      
      // SEMPRE usar a Edge Function - NUNCA VPS direto
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'delete_instance_corrected',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao deletar instância');
      }

      return { 
        success: true,
        method: 'EDGE_FUNCTION_ONLY'
      };
    } catch (error: any) {
      console.error('[API Client] ❌ Erro ao deletar:', error);
      return {
        success: false,
        error: error.message || 'Erro ao deletar instância'
      };
    }
  }

  // MÉTODO CENTRALIZADO PARA OBTER QR CODE
  static async getQRCode(instanceId: string): Promise<ApiResponse> {
    try {
      console.log('[API Client] 📱 Obtendo QR Code via Edge Function whatsapp_qr_service');
      
      // SEMPRE usar a Edge Function whatsapp_qr_service - NUNCA VPS direto
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
          data: { qrCode: data.qrCode },
          method: 'EDGE_FUNCTION_ONLY'
        };
      }

      if (data?.waiting) {
        return {
          success: false,
          data: { waiting: true },
          method: 'EDGE_FUNCTION_ONLY'
        };
      }

      return {
        success: false,
        error: data?.error || 'QR Code não disponível',
        method: 'EDGE_FUNCTION_ONLY'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao buscar QR Code',
        method: 'EDGE_FUNCTION_ONLY'
      };
    }
  }

  // MÉTODO PARA REFRESH QR CODE
  static async refreshQRCode(instanceId: string): Promise<ApiResponse> {
    try {
      console.log('[API Client] 🔄 Refresh QR via Edge Function whatsapp_qr_service');
      
      // SEMPRE usar a Edge Function - NUNCA VPS direto
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
      
      if (qrResult.success && qrResult.data?.qrCode) {
        return {
          success: true,
          data: { qrCode: qrResult.data.qrCode },
          method: 'EDGE_FUNCTION_ONLY'
        };
      }

      return {
        success: false,
        error: 'QR Code não foi gerado após refresh',
        method: 'EDGE_FUNCTION_ONLY'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao fazer refresh do QR Code',
        method: 'EDGE_FUNCTION_ONLY'
      };
    }
  }

  // BLOQUEAR QUALQUER TENTATIVA DE CHAMADA DIRETA VPS
  static blockDirectVPSCall(url: string): never {
    const errorMessage = `🚨 BLOQUEADO: Tentativa de chamada direta para VPS (${url}). Use ApiClient.createInstance() em vez disso.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

export { ApiClient };

// FUNÇÃO HELPER PARA GERAR NOME A PARTIR DO EMAIL
export function generateInstanceNameFromEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return `whatsapp_${Date.now()}`;
  }
  
  const emailPart = email.split('@')[0];
  return emailPart.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
}
