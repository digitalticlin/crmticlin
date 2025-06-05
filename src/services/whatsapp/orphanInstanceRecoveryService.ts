
import { supabase } from "@/integrations/supabase/client";
import { VPS_CONFIG } from "./config/vpsConfig";

export interface OrphanInstance {
  instanceId: string;
  status: string;
  phone?: string;
  profileName?: string;
  companyName?: string;
  isOrphan: boolean;
}

export class OrphanInstanceRecoveryService {
  /**
   * Busca todas as instâncias na VPS
   */
  static async getVPSInstances(): Promise<OrphanInstance[]> {
    try {
      console.log('[Orphan Recovery] 🔍 Buscando instâncias na VPS...');
      
      const response = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`VPS request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Orphan Recovery] 📊 Instâncias encontradas na VPS:', data);

      return (data.instances || []).map((instance: any) => ({
        instanceId: instance.instanceId || instance.id,
        status: instance.status || 'unknown',
        phone: instance.phone,
        profileName: instance.profileName,
        companyName: instance.companyName,
        isOrphan: false // Será determinado na comparação
      }));
    } catch (error) {
      console.error('[Orphan Recovery] ❌ Erro ao buscar instâncias na VPS:', error);
      return [];
    }
  }

  /**
   * Identifica instâncias órfãs (na VPS mas não no Supabase)
   */
  static async findOrphanInstances(companyId: string): Promise<OrphanInstance[]> {
    try {
      console.log('[Orphan Recovery] 🔍 Identificando instâncias órfãs para empresa:', companyId);

      // Buscar instâncias na VPS
      const vpsInstances = await this.getVPSInstances();
      
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

  /**
   * Adota uma instância órfã vinculando-a ao usuário
   */
  static async adoptOrphanInstance(
    orphanInstance: OrphanInstance, 
    companyId: string, 
    instanceName: string
  ): Promise<{ success: boolean; error?: string; instance?: any }> {
    try {
      console.log('[Orphan Recovery] 🤝 Adotando instância órfã:', orphanInstance.instanceId);

      // Verificar se a instância está realmente ativa na VPS
      const status = await this.checkInstanceStatus(orphanInstance.instanceId);
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

  /**
   * Verifica status de uma instância específica na VPS
   */
  static async checkInstanceStatus(instanceId: string): Promise<{ success: boolean; error?: string; status?: string }> {
    try {
      const response = await fetch(`${VPS_CONFIG.baseUrl}/instance/${instanceId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        status: data.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check completo para detectar inconsistências
   */
  static async performHealthCheck(companyId: string): Promise<{
    orphans: OrphanInstance[];
    inconsistencies: any[];
    recommendations: string[];
  }> {
    try {
      console.log('[Orphan Recovery] 🏥 Executando health check completo...');

      const orphans = await this.findOrphanInstances(companyId);
      const inconsistencies: any[] = [];
      const recommendations: string[] = [];

      // Verificar instâncias no Supabase que não existem na VPS
      const { data: supabaseInstances } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', companyId)
        .eq('connection_type', 'web');

      const vpsInstances = await this.getVPSInstances();
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
