
import { supabase } from "@/integrations/supabase/client";

// CONFIGURAÇÃO EXATA DO SCRIPT QUE FUNCIONA
const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 30000
};

interface HybridResponse {
  success: boolean;
  instance?: any;
  error?: string;
  method: 'edge_function' | 'direct_vps';
}

export class HybridInstanceService {
  static async createInstance(instanceName: string): Promise<HybridResponse> {
    console.log('[Hybrid Service] 🚀 PLANO HÍBRIDO: Iniciando criação:', instanceName);

    // VALIDAÇÃO INICIAL
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    if (!instanceName || instanceName.trim().length < 3) {
      throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
    }

    const normalizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');

    // MÉTODO 1: TENTAR EDGE FUNCTION CORRIGIDA
    try {
      console.log('[Hybrid Service] 📡 MÉTODO 1: Tentando Edge Function corrigida...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: normalizedName
        }
      });

      if (error) {
        console.error('[Hybrid Service] ⚠️ MÉTODO 1: Edge Function error:', error);
        throw new Error(`Edge Function error: ${error.message}`);
      }

      if (data && data.success && data.instance) {
        console.log('[Hybrid Service] ✅ MÉTODO 1: Edge Function funcionou!');
        return {
          success: true,
          instance: data.instance,
          method: 'edge_function'
        };
      }

      throw new Error(data?.error || 'Edge Function retornou erro');

    } catch (edgeFunctionError) {
      console.error('[Hybrid Service] ❌ MÉTODO 1 FALHOU:', edgeFunctionError);
      
      // MÉTODO 2: FALLBACK DIRETO VPS (CONFIGURAÇÃO DO SCRIPT)
      console.log('[Hybrid Service] 🔄 MÉTODO 2: Fallback direto VPS com configuração do script...');
      
      try {
        return await this.createInstanceDirectVPS(normalizedName, user);
      } catch (directError) {
        console.error('[Hybrid Service] ❌ MÉTODO 2 FALHOU:', directError);
        throw new Error(`Ambos métodos falharam. Edge Function: ${edgeFunctionError.message}. VPS Direto: ${directError.message}`);
      }
    }
  }

  private static async createInstanceDirectVPS(instanceName: string, user: any): Promise<HybridResponse> {
    console.log('[Hybrid Service] 🎯 DIRETO VPS: Usando configuração EXATA do script');

    // PAYLOAD EXATO DO SCRIPT
    const vpsPayload = {
      instanceId: instanceName,
      sessionName: instanceName,
      webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
    };

    console.log('[Hybrid Service] 📦 DIRETO VPS: Payload:', vpsPayload);

    // REQUISIÇÃO EXATA DO SCRIPT
    const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      body: JSON.stringify(vpsPayload),
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      throw new Error(`VPS HTTP ${vpsResponse.status}: ${errorText}`);
    }

    const vpsData = await vpsResponse.json();
    console.log('[Hybrid Service] 📥 DIRETO VPS: Response:', vpsData);

    if (!vpsData.success) {
      throw new Error(vpsData.error || 'VPS retornou success: false');
    }

    // SALVAR NO SUPABASE APÓS SUCESSO NA VPS
    console.log('[Hybrid Service] 💾 DIRETO VPS: Salvando no Supabase...');
    
    const { data: newInstance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert({
        instance_name: instanceName,
        connection_type: 'web',
        server_url: VPS_CONFIG.baseUrl,
        vps_instance_id: vpsData.instanceId || instanceName,
        web_status: 'initializing',
        connection_status: 'vps_pending',
        created_by_user_id: user.id,
        company_id: null
      })
      .select()
      .single();

    if (dbError) {
      // VPS criou mas Supabase falhou - isso é problemático
      console.error('[Hybrid Service] ⚠️ DIRETO VPS: VPS OK mas Supabase falhou:', dbError);
      
      // Tentar deletar da VPS para evitar órfãs
      try {
        await fetch(`${VPS_CONFIG.baseUrl}/instance/${instanceName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${VPS_CONFIG.authToken}`
          }
        });
        console.log('[Hybrid Service] 🧹 DIRETO VPS: Limpou instância órfã da VPS');
      } catch (cleanupError) {
        console.error('[Hybrid Service] ⚠️ DIRETO VPS: Não conseguiu limpar VPS:', cleanupError);
      }
      
      throw new Error(`VPS criou instância mas erro no Supabase: ${dbError.message}`);
    }

    console.log('[Hybrid Service] ✅ DIRETO VPS: Instância criada e salva com sucesso!');

    return {
      success: true,
      instance: newInstance,
      method: 'direct_vps'
    };
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
