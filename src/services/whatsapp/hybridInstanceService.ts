
import { supabase } from "@/integrations/supabase/client";

// CONFIGURAÇÃO EXATA DO SCRIPT QUE FUNCIONA
const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 60000 // FASE 1: Aumentar timeout para 60s
};

interface HybridResponse {
  success: boolean;
  instance?: any;
  error?: string;
  method?: 'edge_function';
}

export class HybridInstanceService {
  // FASE 1: CORREÇÃO - Usar APENAS Edge Function (sem fallback direto)
  static async createInstance(instanceName: string): Promise<HybridResponse> {
    console.log('[Hybrid Service] 🚀 PLANO REFINADO: Criando via Edge Function apenas:', instanceName);

    // VALIDAÇÃO INICIAL
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    if (!instanceName || instanceName.trim().length < 3) {
      throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
    }

    const normalizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');

    // FASE 1: APENAS Edge Function como proxy único
    try {
      console.log('[Hybrid Service] 📡 PLANO REFINADO: Usando Edge Function como proxy único...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: normalizedName
        }
      });

      if (error) {
        console.error('[Hybrid Service] ⚠️ Edge Function error:', error);
        throw new Error(`Edge Function error: ${error.message}`);
      }

      if (data && data.success && data.instance) {
        console.log('[Hybrid Service] ✅ PLANO REFINADO: Edge Function funcionou!');
        return {
          success: true,
          instance: data.instance,
          method: 'edge_function'
        };
      }

      throw new Error(data?.error || 'Edge Function retornou erro');

    } catch (edgeFunctionError: any) {
      console.error('[Hybrid Service] ❌ PLANO REFINADO: Edge Function falhou:', edgeFunctionError);
      
      // FASE 1: SEM FALLBACK DIRETO - retornar erro imediatamente
      throw new Error(`Falha na Edge Function: ${edgeFunctionError.message}`);
    }
  }

  static async deleteInstance(instanceId: string): Promise<{ success: boolean; error?: string }> {
    try {
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
      console.error('[Hybrid Service] ❌ Erro ao deletar:', error);
      return {
        success: false,
        error: error.message || 'Erro ao deletar instância'
      };
    }
  }
}
