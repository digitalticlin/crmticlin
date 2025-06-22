
import { supabase } from "@/integrations/supabase/client";
import type { SyncResult } from "./types";

export class InstanceSyncService {
  /**
   * Sincroniza instâncias da VPS para o Supabase
   * Chama auto_sync_instances que faz o trabalho pesado
   */
  static async syncAllInstances(): Promise<SyncResult> {
    try {
      console.log('[Instance Sync] 🔄 Iniciando sincronização via auto_sync_instances...');

      const { data, error } = await supabase.functions.invoke('auto_sync_instances', {
        body: {
          action: 'sync_all_instances',
          source: 'manual_request'
        }
      });

      if (error) {
        throw new Error(`Erro na Edge Function: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha na sincronização');
      }

      console.log('[Instance Sync] ✅ Sincronização concluída:', data.syncResults);

      return {
        success: true,
        data: {
          summary: {
            vpsInstances: data.syncResults?.vps_instances || 0,
            dbInstances: data.syncResults?.db_instances || 0,
            synchronized: (data.syncResults?.new_instances || 0) + (data.syncResults?.updated_instances || 0),
            added: data.syncResults?.new_instances || 0,
            updated: data.syncResults?.updated_instances || 0,
            errors: data.syncResults?.errors?.length || 0
          },
          instances: data.syncResults?.instances || []
        }
      };

    } catch (error: any) {
      console.error('[Instance Sync] ❌ Erro na sincronização:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Agenda sincronização automática
   * Por enquanto, apenas log - implementação futura
   */
  static scheduleAutoSync(intervalMinutes: number = 15) {
    console.log(`[Instance Sync] ⏰ Auto-sync agendado para cada ${intervalMinutes} minutos`);
    // TODO: Implementar chamada automática via cron ou Edge Function
  }
}
