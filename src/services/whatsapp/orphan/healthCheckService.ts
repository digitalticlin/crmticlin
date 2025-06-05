
import { supabase } from "@/integrations/supabase/client";
import { HealthCheckResult } from "./types";
import { OrphanDetectionService } from "./orphanDetectionService";
import { VPSInstanceService } from "./vpsInstanceService";

export class HealthCheckService {
  /**
   * Health check completo para detectar inconsistências
   */
  static async performHealthCheck(companyId: string): Promise<HealthCheckResult> {
    try {
      console.log('[Orphan Recovery] 🏥 Executando health check completo...');

      const orphans = await OrphanDetectionService.findOrphanInstances(companyId);
      const inconsistencies: any[] = [];
      const recommendations: string[] = [];

      // Verificar instâncias no Supabase que não existem na VPS
      const { data: supabaseInstances } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', companyId)
        .eq('connection_type', 'web');

      const vpsInstances = await VPSInstanceService.getVPSInstances();
      const vpsInstanceIds = vpsInstances.map(i => i.instanceId);

      for (const dbInstance of supabaseInstances || []) {
        if (dbInstance.vps_instance_id && !vpsInstanceIds.includes(dbInstance.vps_instance_id)) {
          inconsistencies.push({
            type: 'missing_in_vps',
            instance: dbInstance,
            message: `Instância ${dbInstance.instance_name} existe no DB mas não na VPS`
          });
        }
      }

      // Gerar recomendações
      if (orphans.length > 0) {
        recommendations.push(`${orphans.length} instâncias órfãs encontradas - considere adotá-las`);
      }
      
      if (inconsistencies.length > 0) {
        recommendations.push(`${inconsistencies.length} inconsistências encontradas - revisar manualmente`);
      }

      return { orphans, inconsistencies, recommendations };
    } catch (error) {
      console.error('[Orphan Recovery] ❌ Erro no health check:', error);
      return { orphans: [], inconsistencies: [], recommendations: ['Erro no health check'] };
    }
  }
}
