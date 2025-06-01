
import { supabase } from "@/integrations/supabase/client";
import { ServiceResponse } from "../types/whatsappWebTypes";

export class ForceSyncService {
  static async forceSync(vpsInstanceId: string): Promise<ServiceResponse> {
    try {
      console.log('[ForceSyncService] Force syncing instance:', vpsInstanceId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'force_sync',
          instanceData: {
            vpsInstanceId
          }
        }
      });

      if (error) {
        console.error('[ForceSyncService] Force sync error:', error);
        throw new Error(error.message);
      }

      console.log('[ForceSyncService] Force sync response:', data);
      return data;

    } catch (error) {
      console.error('[ForceSyncService] Error forcing sync:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
