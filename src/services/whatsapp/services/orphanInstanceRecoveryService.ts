
import { supabase } from "@/integrations/supabase/client";
import { VPSAuditService } from "./vpsAuditService";
import { toast } from "sonner";

export interface OrphanInstance {
  vpsInstanceId: string;
  sessionName: string;
  state: string;
  isReady: boolean;
  phone?: string;
  name?: string;
}

export class OrphanInstanceRecoveryService {
  /**
   * Encontra e recupera instâncias órfãs (ativas na VPS mas não no banco)
   */
  static async findAndRecoverOrphanInstances(companyId: string): Promise<{
    found: OrphanInstance[];
    recovered: number;
    errors: string[];
  }> {
    try {
      console.log('[OrphanRecovery] Iniciando busca por instâncias órfãs para empresa:', companyId);

      // 1. Buscar todas as conexões VPS
      const vpsResult = await VPSAuditService.listVPSConnections();
      if (!vpsResult.success) {
        throw new Error(`Falha ao listar VPS: ${vpsResult.error}`);
      }

      const vpsConnections = vpsResult.data || [];
      console.log('[OrphanRecovery] Conexões VPS encontradas:', vpsConnections.length);

      // 2. Buscar instâncias do banco para a empresa
      const { data: dbInstances, error: dbError } = await supabase
        .from('whatsapp_instances')
        .select('vps_instance_id, phone, web_status, connection_status')
        .eq('company_id', companyId)
        .eq('connection_type', 'web');

      if (dbError) {
        throw new Error(`Erro no banco: ${dbError.message}`);
      }

      const dbInstanceIds = new Set(dbInstances?.map(i => i.vps_instance_id).filter(Boolean) || []);
      
      // 3. Identificar órfãs (VPS ativo mas não no banco)
      const orphanInstances: OrphanInstance[] = vpsConnections
        .filter(vps => 
          vps.state === 'CONNECTED' && 
          vps.isReady && 
          !dbInstanceIds.has(vps.instanceId)
        )
        .map(vps => ({
          vpsInstanceId: vps.instanceId,
          sessionName: vps.sessionName || `recovered_${Date.now()}`,
          state: vps.state,
          isReady: vps.isReady,
          phone: vps.phone,
          name: vps.name
        }));

      console.log('[OrphanRecovery] Instâncias órfãs encontradas:', orphanInstances.length);

      if (orphanInstances.length === 0) {
        return { found: [], recovered: 0, errors: [] };
      }

      // 4. Recuperar instâncias órfãs
      const recovered: number[] = [];
      const errors: string[] = [];

      for (const orphan of orphanInstances) {
        try {
          console.log('[OrphanRecovery] Recuperando instância órfã:', orphan.vpsInstanceId);

          const { data: recoveredInstance, error: insertError } = await supabase
            .from('whatsapp_instances')
            .insert({
              company_id: companyId,
              instance_name: orphan.sessionName,
              vps_instance_id: orphan.vpsInstanceId,
              connection_type: 'web',
              web_status: 'ready',
              connection_status: 'open',
              phone: orphan.phone || '',
              profile_name: orphan.name || '',
              date_connected: new Date().toISOString(),
              server_url: 'recovered',
              session_data: {
                recovered: true,
                recoveredAt: new Date().toISOString(),
                originalState: orphan.state
              }
            })
            .select()
            .single();

          if (insertError) {
            console.error('[OrphanRecovery] Erro ao recuperar:', orphan.vpsInstanceId, insertError);
            errors.push(`${orphan.vpsInstanceId}: ${insertError.message}`);
          } else {
            console.log('[OrphanRecovery] Instância recuperada com sucesso:', recoveredInstance);
            recovered.push(1);
            
            toast.success(`Instância ${orphan.phone || orphan.vpsInstanceId} recuperada!`);
          }
        } catch (error) {
          console.error('[OrphanRecovery] Erro inesperado ao recuperar:', orphan.vpsInstanceId, error);
          errors.push(`${orphan.vpsInstanceId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      const totalRecovered = recovered.length;
      console.log('[OrphanRecovery] Recuperação concluída:', {
        found: orphanInstances.length,
        recovered: totalRecovered,
        errors: errors.length
      });

      return {
        found: orphanInstances,
        recovered: totalRecovered,
        errors
      };

    } catch (error) {
      console.error('[OrphanRecovery] Falha na recuperação:', error);
      return {
        found: [],
        recovered: 0,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido']
      };
    }
  }

  /**
   * Executa recuperação automática em intervalo
   */
  static startAutoRecovery(companyId: string, intervalMinutes: number = 10) {
    console.log('[OrphanRecovery] Iniciando auto-recuperação a cada', intervalMinutes, 'minutos');

    const autoRecovery = async () => {
      try {
        const result = await this.findAndRecoverOrphanInstances(companyId);
        if (result.recovered > 0) {
          console.log('[OrphanRecovery] Auto-recuperação:', result.recovered, 'instâncias recuperadas');
        }
      } catch (error) {
        console.error('[OrphanRecovery] Erro na auto-recuperação:', error);
      }
    };

    // Primeira execução após 30 segundos
    setTimeout(autoRecovery, 30000);
    
    // Depois em intervalos regulares
    const interval = setInterval(autoRecovery, intervalMinutes * 60 * 1000);

    return () => {
      console.log('[OrphanRecovery] Parando auto-recuperação');
      clearInterval(interval);
    };
  }
}
