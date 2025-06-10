
// CORREÇÃO FINAL: Remover completamente e usar APENAS ApiClient

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
  // CORREÇÃO FINAL: Usar APENAS ApiClient - BLOQUEAR qualquer fallback VPS
  static async createInstance(): Promise<HybridResponse> {
    console.log('[Hybrid Service] 🚀 CORREÇÃO FINAL: Redirecionando para ApiClient APENAS');

    try {
      // VERIFICAR AUTENTICAÇÃO PRIMEIRO
      const authCheck = await ApiClient.checkAuth();
      if (!authCheck.authenticated) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      // USAR CLIENTE CENTRALIZADO - NUNCA CHAMADAS DIRETAS
      const result = await ApiClient.createInstance(authCheck.user?.email);

      if (result.success && result.instance) {
        console.log('[Hybrid Service] ✅ CORREÇÃO FINAL: Sucesso via ApiClient!');
        
        return {
          success: true,
          instance: result.instance,
          method: 'EDGE_FUNCTION_ONLY',
          operationId: result.operationId,
          intelligent_name: result.instance?.instance_name,
          user_email: authCheck.user?.email
        };
      }

      throw new Error(result.error || 'Falha no ApiClient');

    } catch (error: any) {
      console.error('[Hybrid Service] ❌ CORREÇÃO FINAL: Erro no ApiClient:', error);
      
      // SEM FALLBACK PARA VPS DIRETO - APENAS REPORTAR ERRO
      let errorMessage = error.message;
      
      if (errorMessage.includes('não autenticado')) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      } else if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Erro de conexão com Edge Function. Verifique sua internet.';
      } else if (errorMessage.includes('500')) {
        errorMessage = 'Erro interno da Edge Function. Tente novamente.';
      }
      
      throw new Error(errorMessage);
    }
  }

  static async deleteInstance(instanceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[Hybrid Service] 🗑️ CORREÇÃO FINAL: Deletando via ApiClient apenas:', instanceId);
      
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
