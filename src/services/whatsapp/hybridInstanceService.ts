
import { supabase } from "@/integrations/supabase/client";

interface HybridResponse {
  success: boolean;
  instance?: any;
  error?: string;
  method?: 'edge_function_only';
  operationId?: string;
  intelligent_name?: string;
  user_email?: string;
}

export class HybridInstanceService {
  // CORREÇÃO: Usar APENAS a Edge Function (sem fallback para VPS direto)
  static async createInstance(): Promise<HybridResponse> {
    console.log('[Hybrid Service] 🚀 CORREÇÃO: Usando APENAS Edge Function (sem VPS direto)');

    // VALIDAÇÃO INICIAL
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    if (!user.email) {
      throw new Error('Email do usuário é obrigatório para gerar nome inteligente');
    }

    console.log('[Hybrid Service] 👤 Usuário autenticado:', user.email);

    // CORREÇÃO: Usar APENAS Edge Function (sem chamadas diretas ao VPS)
    try {
      console.log('[Hybrid Service] 📡 CORREÇÃO: Chamando Edge Function whatsapp_instance_manager...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance'
          // Não passamos instanceName - será gerado inteligentemente baseado no email
        }
      });

      console.log('[Hybrid Service] 📥 CORREÇÃO: Resposta da Edge Function:', {
        success: data?.success,
        hasInstance: !!(data?.instance),
        error: data?.error || error?.message
      });

      if (error) {
        console.error('[Hybrid Service] ❌ CORREÇÃO: Edge Function error:', error);
        throw new Error(`Edge Function error: ${error.message}`);
      }

      if (data && data.success && data.instance) {
        console.log('[Hybrid Service] ✅ CORREÇÃO: Edge Function funcionou!');
        console.log('[Hybrid Service] 🎯 Nome inteligente gerado:', data.intelligent_name);
        console.log('[Hybrid Service] 🆔 Operation ID:', data.operationId);
        
        return {
          success: true,
          instance: data.instance,
          method: 'edge_function_only',
          operationId: data.operationId,
          intelligent_name: data.intelligent_name,
          user_email: data.user_email
        };
      }

      throw new Error(data?.error || 'Edge Function retornou erro');

    } catch (edgeFunctionError: any) {
      console.error('[Hybrid Service] ❌ CORREÇÃO: Edge Function falhou:', edgeFunctionError);
      
      // CORREÇÃO: NÃO fazer fallback para VPS direto - apenas reportar erro
      let errorMessage = edgeFunctionError.message;
      
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
      console.log('[Hybrid Service] 🗑️ CORREÇÃO: Deletando via Edge Function apenas:', instanceId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'delete_instance_corrected',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao deletar instância');
      }

      return { success: true };
    } catch (error: any) {
      console.error('[Hybrid Service] ❌ CORREÇÃO: Erro ao deletar:', error);
      return {
        success: false,
        error: error.message || 'Erro ao deletar instância'
      };
    }
  }
}
