
import { supabase } from "@/integrations/supabase/client";

interface EndpointDiscoveryResult {
  success: boolean;
  workingEndpoints?: {
    qrCode?: string;
    sendMessage?: string;
    deleteInstance?: string;
    status?: string;
  };
  error?: string;
  fullReport?: any;
}

export class VPSEndpointDiscovery {
  static async discoverWorkingEndpoints(): Promise<EndpointDiscoveryResult> {
    try {
      console.log('[VPS Discovery] 🔍 Iniciando descoberta de endpoints...');

      const { data, error } = await supabase.functions.invoke('vps_endpoint_discovery', {
        body: {
          action: 'discover_all_endpoints',
          testInstanceId: 'discovery_test_' + Date.now()
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('[VPS Discovery] 📊 Resultado:', data);

      if (data.success) {
        return {
          success: true,
          workingEndpoints: data.workingEndpoints,
          fullReport: data.fullReport
        };
      } else {
        return {
          success: false,
          error: data.error || 'Descoberta falhou',
          fullReport: data.fullReport
        };
      }

    } catch (error: any) {
      console.error('[VPS Discovery] ❌ Erro:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async cleanupAllInstances(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      console.log('[VPS Discovery] 🧹 Iniciando limpeza de instâncias...');

      const { data, error } = await supabase.functions.invoke('vps_cleanup_service', {
        body: {
          action: 'delete_all_instances'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;

    } catch (error: any) {
      console.error('[VPS Discovery] ❌ Erro na limpeza:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
