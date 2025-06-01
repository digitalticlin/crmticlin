
import { supabase } from "@/integrations/supabase/client";
import { VPS_CONFIG } from "../config/vpsConfig";
import { ServiceResponse } from "../types/whatsappWebTypes";

export class InstanceCleanupService {
  /**
   * Deleta instância garantindo cleanup no VPS antes de remover do banco
   */
  static async deleteInstanceWithCleanup(instanceId: string): Promise<ServiceResponse> {
    try {
      console.log('[InstanceCleanupService] Starting safe delete for instance:', instanceId);

      // Primeiro, buscar dados da instância
      const { data: instance, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', instanceId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch instance: ${fetchError.message}`);
      }

      if (!instance) {
        throw new Error('Instance not found');
      }

      // Se tem vps_instance_id, tentar desconectar do VPS primeiro
      if (instance.vps_instance_id) {
        console.log('[InstanceCleanupService] Disconnecting from VPS:', instance.vps_instance_id);
        
        try {
          const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/delete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              instanceId: instance.vps_instance_id
            }),
            signal: AbortSignal.timeout(10000)
          });

          if (vpsResponse.ok) {
            console.log('[InstanceCleanupService] VPS cleanup successful');
          } else {
            console.warn('[InstanceCleanupService] VPS cleanup failed, but continuing with DB delete');
          }
        } catch (vpsError) {
          console.warn('[InstanceCleanupService] VPS cleanup error, but continuing:', vpsError);
        }
      }

      // Agora deletar do banco
      console.log('[InstanceCleanupService] Deleting from database');
      const { error: deleteError } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instanceId);

      if (deleteError) {
        throw new Error(`Database delete failed: ${deleteError.message}`);
      }

      console.log('[InstanceCleanupService] Instance deleted successfully');

      return {
        success: true,
        data: { 
          message: 'Instance deleted successfully',
          vpsCleanup: !!instance.vps_instance_id
        }
      };

    } catch (error) {
      console.error('[InstanceCleanupService] Delete failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Implementa heartbeat para manter conexão ativa
   */
  static async sendHeartbeat(vpsInstanceId: string): Promise<ServiceResponse> {
    try {
      console.log('[InstanceCleanupService] Sending heartbeat for:', vpsInstanceId);

      const response = await fetch(`${VPS_CONFIG.baseUrl}/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceId: vpsInstanceId,
          timestamp: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Heartbeat failed: HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('[InstanceCleanupService] Heartbeat failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Força reconexão para instâncias que estão ativas no celular mas desconectadas no sistema
   */
  static async forceReconnection(instanceId: string): Promise<ServiceResponse> {
    try {
      console.log('[InstanceCleanupService] Forcing reconnection for:', instanceId);

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'force_reconnect',
          instanceData: {
            instanceId
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('[InstanceCleanupService] Force reconnection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
