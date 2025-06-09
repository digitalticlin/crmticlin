
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { SyncResponse } from "@/services/whatsapp/types/whatsappWebTypes";

export class InstanceSyncService {
  static async syncAllInstances(): Promise<SyncResponse> {
    try {
      console.log('[InstanceSync] 🔄 Iniciando sincronização completa...');

      // CORREÇÃO: Usar o método corrigido com retorno tipado
      const syncResult = await WhatsAppWebService.syncInstances();
      
      if (!syncResult.success) {
        throw new Error(syncResult.error || 'Falha na sincronização VPS');
      }

      console.log('[InstanceSync] ✅ Sincronização VPS concluída:', {
        summary: syncResult.data?.summary,
        instanceCount: syncResult.data?.instances?.length || 0
      });

      // Buscar instâncias atualizadas do banco local
      const localInstances = await WhatsAppWebService.getInstances();

      return {
        success: true,
        data: {
          summary: syncResult.data?.summary || {
            updated: localInstances.length,
            preserved: 0,
            adopted: 0,
            errors: 0
          },
          instances: localInstances
        }
      };

    } catch (error: any) {
      console.error('[InstanceSync] ❌ Erro na sincronização:', error);
      return {
        success: false,
        error: error.message || 'Erro na sincronização',
        data: {
          summary: {
            updated: 0,
            preserved: 0,
            adopted: 0,
            errors: 1
          },
          instances: []
        }
      };
    }
  }
}
