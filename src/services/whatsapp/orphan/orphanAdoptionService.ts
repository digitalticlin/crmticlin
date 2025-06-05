
import { supabase } from "@/integrations/supabase/client";
import { VPS_CONFIG } from "../config/vpsConfig";
import { OrphanInstance, AdoptionResult } from "./types";
import { VPSInstanceService } from "./vpsInstanceService";

export class OrphanAdoptionService {
  /**
   * Adota uma instância órfã vinculando-a ao usuário
   */
  static async adoptOrphanInstance(
    orphanInstance: OrphanInstance, 
    companyId: string, 
    instanceName: string
  ): Promise<AdoptionResult> {
    try {
      console.log('[Orphan Recovery] 🤝 Adotando instância órfã:', orphanInstance.instanceId);

      // Verificar se a instância está realmente ativa na VPS
      const status = await VPSInstanceService.checkInstanceStatus(orphanInstance.instanceId);
      if (!status.success) {
        throw new Error(`Instância não está ativa na VPS: ${status.error}`);
      }

      // Criar registro no Supabase
      const { data: dbInstance, error: dbError } = await supabase
        .from('whatsapp_instances')
        .insert({
          instance_name: instanceName,
          phone: orphanInstance.phone || '',
          company_id: companyId,
          connection_type: 'web',
          server_url: VPS_CONFIG.baseUrl,
          vps_instance_id: orphanInstance.instanceId,
          web_status: orphanInstance.status === 'open' ? 'ready' : 'connecting',
          connection_status: orphanInstance.status === 'open' ? 'ready' : 'connecting',
          profile_name: orphanInstance.profileName,
          date_connected: orphanInstance.status === 'open' ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Erro no banco: ${dbError.message}`);
      }

      console.log('[Orphan Recovery] ✅ Instância órfã adotada com sucesso:', dbInstance.id);

      return {
        success: true,
        instance: dbInstance
      };
    } catch (error: any) {
      console.error('[Orphan Recovery] ❌ Erro ao adotar órfã:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
