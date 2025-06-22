
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "../instanceDatabaseService";
import type { DualCreationParams, DualCreationResult } from "./types";

export class DualCreationService {
  /**
   * Cria instância no banco E na VPS simultaneamente
   * Prioridade: Banco primeiro, depois VPS
   */
  static async createInstanceDual(params: DualCreationParams): Promise<DualCreationResult> {
    try {
      console.log('[Dual Creation] 🚀 Iniciando criação dual:', params);

      // ETAPA 1: Salvar no banco PRIMEIRO
      const dbInstance = await this.saveToDatabase(params);
      console.log('[Dual Creation] ✅ Instância salva no banco:', dbInstance.id);

      // ETAPA 2: Criar na VPS usando whatsapp_instance_manager
      try {
        const vpsResponse = await this.createInVPS(params, dbInstance);
        console.log('[Dual Creation] ✅ Instância criada na VPS');

        return {
          success: true,
          instance: dbInstance,
          vpsResponse,
          mode: 'dual_success'
        };

      } catch (vpsError: any) {
        console.error('[Dual Creation] ⚠️ VPS falhou, mas banco OK:', vpsError.message);
        
        // Atualizar status no banco para indicar falha na VPS
        await supabase
          .from('whatsapp_instances')
          .update({ 
            web_status: 'vps_creation_failed',
            connection_status: 'pending' 
          })
          .eq('id', dbInstance.id);

        return {
          success: true,
          instance: dbInstance,
          error: `VPS falhou: ${vpsError.message}`,
          mode: 'db_only'
        };
      }

    } catch (error: any) {
      console.error('[Dual Creation] ❌ Erro geral:', error);
      return {
        success: false,
        error: error.message,
        mode: 'failed'
      };
    }
  }

  private static async saveToDatabase(params: DualCreationParams) {
    const userId = await getCurrentUserId();
    const intelligentName = this.generateIntelligentName(params.instanceName, params.userEmail);

    const instanceData = {
      instance_name: intelligentName,
      connection_type: 'web',
      server_url: 'http://31.97.24.222:3002',
      vps_instance_id: intelligentName,
      web_status: 'creating',
      connection_status: 'pending',
      created_by_user_id: userId,
      qr_code: null
    };

    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .insert(instanceData)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao salvar no banco: ${error.message}`);
    }

    return instance;
  }

  private static async createInVPS(params: DualCreationParams, dbInstance: any) {
    const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
      body: {
        action: 'create_instance',
        instanceName: dbInstance.instance_name
      }
    });

    if (error) {
      throw new Error(`Erro na Edge Function: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Falha desconhecida na VPS');
    }

    return data;
  }

  private static generateIntelligentName(baseInstanceName?: string, userEmail?: string): string {
    const timestamp = Date.now();
    const baseName = baseInstanceName || userEmail?.split('@')[0] || 'whatsapp';
    return `${baseName}_${timestamp}`;
  }
}
