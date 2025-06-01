
import { supabase } from "@/integrations/supabase/client";

export interface OrphanInstance {
  vpsInstanceId: string;
  sessionName: string;
  state: string;
  isReady: boolean;
  phone?: string;
  name?: string;
}

export class OrphanInstanceValidator {
  /**
   * Identifica instâncias órfãs comparando VPS vs Banco
   */
  static identifyOrphans(vpsInstances: any[], dbInstances: any[]): OrphanInstance[] {
    const dbInstanceIds = new Set(
      dbInstances?.map(i => i.vps_instance_id).filter(Boolean) || []
    );
    
    return vpsInstances
      .filter(vps => {
        const instanceId = vps.instanceId || vps.id || vps.instance_id;
        const state = vps.state || vps.status || 'unknown';
        const isReady = Boolean(vps.isReady || vps.is_ready || vps.ready);
        const isConnected = state === 'CONNECTED' || state === 'ready';
        const notInDB = !dbInstanceIds.has(instanceId);
        
        console.log('[OrphanValidator] Analisando VPS:', {
          instanceId,
          state,
          isReady,
          isConnected,
          notInDB,
          willInclude: isConnected && isReady && notInDB
        });
        
        return isConnected && isReady && notInDB;
      })
      .map(vps => ({
        vpsInstanceId: vps.instanceId || vps.id || vps.instance_id,
        sessionName: vps.sessionName || vps.session_name || vps.name || `recovered_${Date.now()}`,
        state: vps.state || vps.status || 'CONNECTED',
        isReady: Boolean(vps.isReady || vps.is_ready || vps.ready),
        phone: vps.phone || vps.number || vps.phoneNumber,
        name: vps.name || vps.profile_name || vps.profileName
      }));
  }

  /**
   * Busca instâncias do banco para uma empresa
   */
  static async getDbInstances(companyId: string) {
    const { data: dbInstances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id, phone, web_status, connection_status')
      .eq('company_id', companyId)
      .eq('connection_type', 'web');

    if (dbError) {
      console.error('[OrphanValidator] Erro no banco:', dbError);
      throw new Error(`Erro no banco: ${dbError.message}`);
    }

    return dbInstances || [];
  }
}
