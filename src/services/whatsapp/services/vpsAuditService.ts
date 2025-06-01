import { VPS_CONFIG } from "../config/vpsConfig";
import { ServiceResponse } from "../types/whatsappWebTypes";
import { supabase } from "@/integrations/supabase/client";
import { VPSInstanceManager } from "./vpsInstanceManager";

export interface VPSConnection {
  instanceId: string;
  sessionName: string;
  state: string;
  isReady: boolean;
  phone?: string;
  name?: string;
  createdAt: string;
  lastActivity?: string;
}

export interface AuditResult {
  vpsConnections: VPSConnection[];
  dbInstances: any[];
  orphanedVPS: VPSConnection[];
  orphanedDB: any[];
  discrepancies: {
    type: 'status_mismatch' | 'missing_vps' | 'missing_db';
    instance: any;
    details: string;
  }[];
}

export class VPSAuditService {
  /**
   * Lista todas as conexões ativas no VPS
   */
  static async listVPSConnections(): Promise<ServiceResponse<VPSConnection[]>> {
    try {
      console.log('[VPSAuditService] Conectando ao VPS:', VPS_CONFIG.baseUrl);
      
      // Usar o novo VPSInstanceManager
      const instances = await VPSInstanceManager.getVPSInstances();

      // Normalizar dados das instâncias
      const normalizedInstances: VPSConnection[] = instances.map((instance: any) => ({
        instanceId: instance.instanceId || instance.id || instance.instance_id || 'unknown',
        sessionName: instance.sessionName || instance.session_name || instance.name || 'unknown',
        state: instance.state || instance.status || 'UNKNOWN',
        isReady: Boolean(instance.isReady || instance.is_ready || instance.ready),
        phone: instance.phone || instance.number || instance.phoneNumber,
        name: instance.name || instance.profile_name || instance.profileName,
        createdAt: instance.createdAt || instance.created_at || new Date().toISOString(),
        lastActivity: instance.lastActivity || instance.last_activity
      }));

      console.log('[VPSAuditService] Instâncias normalizadas:', normalizedInstances.length);

      return {
        success: true,
        data: normalizedInstances
      };

    } catch (error) {
      console.error('[VPSAuditService] Erro detalhado ao listar VPS:', error);
      
      let errorMessage = 'Erro desconhecido';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Timeout: VPS não respondeu em 15 segundos';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Falha na conexão: VPS pode estar offline ou inacessível';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'Erro CORS: problema na configuração do VPS';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Realiza auditoria completa comparando VPS vs Supabase
   */
  static async performAudit(companyId?: string): Promise<ServiceResponse<AuditResult>> {
    try {
      console.log('[VPSAuditService] Starting audit for company:', companyId);

      // Buscar conexões VPS
      const vpsResult = await this.listVPSConnections();
      if (!vpsResult.success) {
        throw new Error(`Failed to get VPS connections: ${vpsResult.error}`);
      }

      // Buscar instâncias do banco
      let dbQuery = supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web');

      if (companyId) {
        dbQuery = dbQuery.eq('company_id', companyId);
      }

      const { data: dbInstances, error: dbError } = await dbQuery;

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      const vpsConnections = vpsResult.data || [];
      const dbInstancesData = dbInstances || [];

      // Encontrar instâncias órfãs
      const orphanedVPS = vpsConnections.filter(vpsConn => 
        !dbInstancesData.find(dbInst => dbInst.vps_instance_id === vpsConn.instanceId)
      );

      const orphanedDB = dbInstancesData.filter(dbInst => 
        dbInst.vps_instance_id && !vpsConnections.find(vpsConn => vpsConn.instanceId === dbInst.vps_instance_id)
      );

      // Encontrar discrepâncias de status
      const discrepancies: AuditResult['discrepancies'] = [];

      dbInstancesData.forEach(dbInst => {
        if (!dbInst.vps_instance_id) return;

        const vpsConn = vpsConnections.find(vps => vps.instanceId === dbInst.vps_instance_id);
        
        if (!vpsConn) {
          discrepancies.push({
            type: 'missing_vps',
            instance: dbInst,
            details: `DB shows instance ${dbInst.vps_instance_id} but not found in VPS`
          });
          return;
        }

        // Verificar discrepâncias de status
        const dbConnected = ['ready', 'open'].includes(dbInst.web_status || dbInst.connection_status);
        const vpsConnected = vpsConn.state === 'CONNECTED' && vpsConn.isReady;

        if (dbConnected !== vpsConnected) {
          discrepancies.push({
            type: 'status_mismatch',
            instance: { ...dbInst, vpsState: vpsConn.state },
            details: `DB status: ${dbInst.web_status}, VPS status: ${vpsConn.state}`
          });
        }

        // Verificar discrepâncias de telefone
        if (vpsConn.phone && dbInst.phone && vpsConn.phone !== dbInst.phone) {
          discrepancies.push({
            type: 'status_mismatch',
            instance: { ...dbInst, vpsPhone: vpsConn.phone },
            details: `Phone mismatch - DB: ${dbInst.phone}, VPS: ${vpsConn.phone}`
          });
        }
      });

      const auditResult: AuditResult = {
        vpsConnections,
        dbInstances: dbInstancesData,
        orphanedVPS,
        orphanedDB,
        discrepancies
      };

      console.log('[VPSAuditService] Audit completed:', {
        vpsCount: vpsConnections.length,
        dbCount: dbInstancesData.length,
        orphanedVPSCount: orphanedVPS.length,
        orphanedDBCount: orphanedDB.length,
        discrepanciesCount: discrepancies.length
      });

      return {
        success: true,
        data: auditResult
      };

    } catch (error) {
      console.error('[VPSAuditService] Audit failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Limpa instâncias órfãs do VPS
   */
  static async cleanupOrphanedVPS(instanceIds: string[]): Promise<ServiceResponse> {
    try {
      console.log('[VPSAuditService] Cleaning up orphaned VPS instances:', instanceIds);

      const results = await Promise.allSettled(
        instanceIds.map(async (instanceId) => {
          const response = await fetch(`${VPS_CONFIG.baseUrl}/delete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ instanceId }),
            signal: AbortSignal.timeout(10000)
          });

          if (!response.ok) {
            throw new Error(`Failed to delete ${instanceId}: HTTP ${response.status}`);
          }

          return { instanceId, success: true };
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log('[VPSAuditService] Cleanup results:', { successful, failed });

      return {
        success: true,
        data: { successful, failed, total: instanceIds.length }
      };

    } catch (error) {
      console.error('[VPSAuditService] Cleanup failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Força sincronização de instâncias específicas
   */
  static async forceSyncInstances(instanceIds: string[]): Promise<ServiceResponse> {
    try {
      console.log('[VPSAuditService] Force syncing instances:', instanceIds);

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'bulk_force_sync',
          instanceData: {
            instanceIds
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('[VPSAuditService] Force sync completed:', data);

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('[VPSAuditService] Force sync failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
