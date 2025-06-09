
import { InstanceSyncService } from "./instanceSyncService";
import { SyncResponse } from "@/services/whatsapp/types/whatsappWebTypes";

export class IntelligentSyncService {
  private static isRunning = false;
  private static lastSync = 0;
  private static readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutos

  static async performIntelligentSync(): Promise<SyncResponse> {
    if (this.isRunning) {
      console.log('[IntelligentSync] ⏳ Sincronização já em andamento');
      return {
        success: false,
        error: 'Sincronização já em andamento',
        data: {
          summary: { updated: 0, preserved: 0, adopted: 0, errors: 1 },
          instances: []
        }
      };
    }

    const now = Date.now();
    if (now - this.lastSync < this.SYNC_INTERVAL) {
      console.log('[IntelligentSync] ⏰ Aguardando intervalo mínimo');
      return {
        success: false,
        error: 'Aguardando intervalo mínimo',
        data: {
          summary: { updated: 0, preserved: 0, adopted: 0, errors: 1 },
          instances: []
        }
      };
    }

    this.isRunning = true;
    this.lastSync = now;

    try {
      console.log('[IntelligentSync] 🧠 Iniciando sincronização inteligente...');

      // CORREÇÃO: Usar método corrigido com retorno tipado
      const result = await InstanceSyncService.syncAllInstances();
      
      console.log('[IntelligentSync] ✅ Sincronização inteligente concluída:', {
        success: result.success,
        summary: result.data?.summary
      });

      return result;

    } catch (error: any) {
      console.error('[IntelligentSync] ❌ Erro na sincronização inteligente:', error);
      return {
        success: false,
        error: error.message || 'Erro na sincronização inteligente',
        data: {
          summary: { updated: 0, preserved: 0, adopted: 0, errors: 1 },
          instances: []
        }
      };
    } finally {
      this.isRunning = false;
    }
  }
}
