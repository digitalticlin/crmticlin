
import { supabase } from "@/integrations/supabase/client";

// Usando a nova Edge Function robusta
const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 90000 // 90s timeout alinhado com a Edge Function
};

interface HybridResponse {
  success: boolean;
  instance?: any;
  error?: string;
  method?: 'robust_edge_function';
  operationId?: string;
  vps_health?: {
    latency: number;
    healthy: boolean;
  };
}

export class HybridInstanceService {
  // Usar APENAS a Edge Function robusta (sem fallback)
  static async createInstance(instanceName: string): Promise<HybridResponse> {
    console.log('[Hybrid Service] 🚀 SISTEMA ROBUSTO: Criando via Edge Function robusta:', instanceName);

    // VALIDAÇÃO INICIAL
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    if (!instanceName || instanceName.trim().length < 3) {
      throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
    }

    const normalizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');

    // Usar APENAS a Edge Function robusta
    try {
      console.log('[Hybrid Service] 📡 SISTEMA ROBUSTO: Usando Edge Function robusta como proxy com retry...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: normalizedName
        }
      });

      if (error) {
        console.error('[Hybrid Service] ⚠️ Edge Function robusta error:', error);
        throw new Error(`Edge Function robusta error: ${error.message}`);
      }

      if (data && data.success && data.instance) {
        console.log('[Hybrid Service] ✅ SISTEMA ROBUSTO: Edge Function robusta funcionou!');
        console.log('[Hybrid Service] 📊 VPS Health:', data.vps_health);
        console.log('[Hybrid Service] 🆔 Operation ID:', data.operationId);
        
        return {
          success: true,
          instance: data.instance,
          method: 'robust_edge_function',
          operationId: data.operationId,
          vps_health: data.vps_health
        };
      }

      throw new Error(data?.error || 'Edge Function robusta retornou erro');

    } catch (edgeFunctionError: any) {
      console.error('[Hybrid Service] ❌ SISTEMA ROBUSTO: Edge Function robusta falhou:', edgeFunctionError);
      
      // Analisar o tipo de erro para fornecer mensagem específica
      let errorMessage = edgeFunctionError.message;
      
      if (errorMessage.includes('VPS não está saudável')) {
        errorMessage = 'Servidor VPS temporariamente indisponível. Tente novamente em alguns minutos.';
      } else if (errorMessage.includes('Timeout')) {
        errorMessage = 'Timeout na comunicação - servidor pode estar sobrecarregado. O sistema tentou automaticamente.';
      } else if (errorMessage.includes('HTTP')) {
        errorMessage = 'Erro de comunicação com servidor. Verifique sua conexão.';
      }
      
      throw new Error(errorMessage);
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
