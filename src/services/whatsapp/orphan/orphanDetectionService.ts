
import { supabase } from "@/integrations/supabase/client";
import { OrphanInstance } from "./types";
import { VPSInstanceService } from "./vpsInstanceService";

export class OrphanDetectionService {
  /**
   * Identifica instâncias órfãs (na VPS mas não no Supabase)
   */
  static async findOrphanInstances(companyId: string): Promise<OrphanInstance[]> {
    try {
      console.log('[Orphan Recovery] 🔍 Identificando instâncias órfãs para empresa:', companyId);

      // Buscar instâncias na VPS
      const vpsInstances = await VPSInstanceService.getVPSInstances();
      
      // Buscar instâncias no Supabase
      const { data: supabaseInstances, error } = await supabase
        .from('whatsapp_instances')
        .select('vps_instance_id')
        .eq('company_id', companyId)
        .eq('connection_type', 'web');

      if (error) {
        throw error;
      }

      const supabaseInstanceIds = (supabaseInstances || [])
        .map(i => i.vps_instance_id)
        .filter(Boolean);

      // Identificar órfãs
      const orphans = vpsInstances.filter(vpsInstance => 
        !supabaseInstanceIds.includes(vpsInstance.instanceId)
      ).map(instance => ({
        ...instance,
        isOrphan: true
      }));

      console.log(`[Orphan Recovery] 🚨 ${orphans.length} instâncias órfãs encontradas`);
      return orphans;
    } catch (error) {
      console.error('[Orphan Recovery] ❌ Erro ao identificar órfãs:', error);
      return [];
    }
  }
}
