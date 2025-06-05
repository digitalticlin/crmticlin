
import { VPS_CONFIG } from "../config/vpsConfig";
import { OrphanInstance } from "./types";

export class VPSInstanceService {
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
}
