
import { ApiClient } from "@/lib/apiClient";

interface HybridResponse {
  success: boolean;
  instance?: any;
  error?: string;
  method?: string;
  operationId?: string;
  intelligent_name?: string;
  user_email?: string;
}

export class HybridInstanceService {
  // USAR APENAS EDGE FUNCTION VIA API CLIENT
  static async createInstance(): Promise<HybridResponse> {
    console.log('[Hybrid Service] 🚀 CORREÇÃO FINAL: Usando APENAS Edge Function via ApiClient');

    try {
      // USAR CLIENTE CENTRALIZADO - NUNCA CHAMADAS DIRETAS
      const result = await ApiClient.createInstance('user_email_from_auth');

      if (result.success && result.instance) {
        console.log('[Hybrid Service] ✅ CORREÇÃO FINAL: Sucesso via Edge Function!');
        
        return {
          success: true,
          instance: result.instance,
          method: 'EDGE_FUNCTION_ONLY',
          operationId: result.operationId,
          intelligent_name: result.instance?.instance_name,
          user_email: 'from_auth_token'
        };
      }

      throw new Error(result.error || 'Falha na Edge Function');

    } catch (error: any) {
      console.error('[Hybrid Service] ❌ CORREÇÃO FINAL: Erro na Edge Function:', error);
      
      // SEM FALLBACK PARA VPS DIRETO - APENAS REPORTAR ERRO
      let errorMessage = error.message;
      
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Erro de conexão com Edge Function. Verifique sua internet.';
      } else if (errorMessage.includes('500')) {
        errorMessage = 'Erro interno da Edge Function. Tente novamente.';
      }
      
      throw new Error(errorMessage);
    }
  }

  static async deleteInstance(instanceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[Hybrid Service] 🗑️ CORREÇÃO FINAL: Deletando via Edge Function apenas:', instanceId);
      
      // USAR CLIENTE CENTRALIZADO - NUNCA CHAMADAS DIRETAS
      const result = await ApiClient.deleteInstance(instanceId);
      
      if (result.success) {
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Erro ao deletar instância'
      };
    } catch (error: any) {
      console.error('[Hybrid Service] ❌ CORREÇÃO FINAL: Erro ao deletar:', error);
      return {
        success: false,
        error: error.message || 'Erro ao deletar instância'
      };
    }
  }
}
