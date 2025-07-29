
import { supabase } from "@/integrations/supabase/client";
import { OrphanInstance } from "./types";

export class VPSInstanceService {
  /**
   * Busca todas as instâncias na VPS via Edge Function segura
   */
  static async getVPSInstances(): Promise<OrphanInstance[]> {
    try {
      console.log('[Orphan Recovery] 🔍 Buscando instâncias na VPS...');
      
      const { data, error } = await supabase.functions.invoke('secure_whatsapp_service', {
        body: {
          action: 'list_instances'
        }
      });

      if (error) {
        console.error('[Orphan Recovery] ❌ Erro ao buscar instâncias:', error);
        return [];
      }

      const instances = data?.instances || [];
      console.log('[Orphan Recovery] 📊 Instâncias encontradas na VPS:', instances);

      return instances.map((instance: any) => ({
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
   * Verifica status de uma instância específica na VPS via Edge Function
   */
  static async checkInstanceStatus(instanceId: string): Promise<{ success: boolean; error?: string; status?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('secure_whatsapp_service', {
        body: {
          action: 'get_instance_status',
          instanceId
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        status: data?.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
