

import { supabase } from "@/integrations/supabase/client";

// Configuração atualizada para FASE 2 - criação direta
const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 30000 // 30s timeout para criação direta
};

interface HybridResponse {
  success: boolean;
  instance?: any;
  error?: string;
  method?: 'direct_edge_function';
  operationId?: string;
  intelligent_name?: string;
  user_email?: string;
}

export class HybridInstanceService {
  // FASE 2: Usar APENAS a Edge Function com criação direta (sem health check)
  static async createInstance(): Promise<HybridResponse> {
    console.log('[Hybrid Service] 🚀 FASE 2: Criação DIRETA via Edge Function (sem health check)');

    // VALIDAÇÃO INICIAL
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    if (!user.email) {
      throw new Error('Email do usuário é obrigatório para gerar nome inteligente');
    }

    console.log('[Hybrid Service] 👤 Usuário autenticado:', user.email);

    // FASE 2: Usar Edge Function com sistema inteligente de nomes
    try {
      console.log('[Hybrid Service] 📡 FASE 2: Usando Edge Function com nome inteligente baseado em email...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance'
          // Não passamos instanceName - será gerado inteligentemente baseado no email
        }
      });

      if (error) {
        console.error('[Hybrid Service] ⚠️ Edge Function direta error:', error);
        throw new Error(`Edge Function direta error: ${error.message}`);
      }

      if (data && data.success && data.instance) {
        console.log('[Hybrid Service] ✅ FASE 2: Edge Function direta funcionou!');
        console.log('[Hybrid Service] 🎯 Nome inteligente gerado:', data.intelligent_name);
        console.log('[Hybrid Service] 📊 Skip Health Check:', data.skip_health_check);
        console.log('[Hybrid Service] 🆔 Operation ID:', data.operationId);
        
        return {
          success: true,
          instance: data.instance,
          method: 'direct_edge_function',
          operationId: data.operationId,
          intelligent_name: data.intelligent_name,
          user_email: data.user_email
        };
      }

      throw new Error(data?.error || 'Edge Function direta retornou erro');

    } catch (edgeFunctionError: any) {
      console.error('[Hybrid Service] ❌ FASE 2: Edge Function direta falhou:', edgeFunctionError);
      
      // Analisar o tipo de erro para fornecer mensagem específica
      let errorMessage = edgeFunctionError.message;
      
      if (errorMessage.includes('Timeout')) {
        errorMessage = 'Timeout na comunicação com VPS - criação direta falhou. Tente novamente.';
      } else if (errorMessage.includes('HTTP')) {
        errorMessage = 'Erro de comunicação com servidor VPS. Verifique sua conexão.';
      } else if (errorMessage.includes('Email do usuário é obrigatório')) {
        errorMessage = 'Erro na geração do nome da instância. Email do usuário não encontrado.';
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

