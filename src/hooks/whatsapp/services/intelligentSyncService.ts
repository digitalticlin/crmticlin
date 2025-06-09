
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';
import { supabase } from "@/integrations/supabase/client";

interface SyncResult {
  success: boolean;
  instancesProcessed: number;
  errors: string[];
  details?: any;
}

export class IntelligentSyncService {
  static async performIntelligentSync(): Promise<SyncResult> {
    try {
      console.log('[Intelligent Sync] 🔄 Iniciando sincronização inteligente...');
      
      // 1. Verificar saúde geral do servidor
      const healthCheck = await WhatsAppWebService.checkServerHealth();
      
      if (!healthCheck.success) {
        throw new Error(`Servidor não disponível: ${healthCheck.error}`);
      }
      
      // 2. Obter informações do servidor
      const serverInfo = await WhatsAppWebService.getServerInfo();
      
      if (!serverInfo.success) {
        console.warn('[Intelligent Sync] ⚠️ Não foi possível obter info do servidor');
      }
      
      // 3. Buscar instâncias locais que precisam de sync
      const { data: localInstances, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .in('connection_status', ['pending', 'connecting', 'waiting_scan']);
      
      if (error) {
        throw new Error(`Erro ao buscar instâncias locais: ${error.message}`);
      }
      
      // 4. Executar sincronização com o servidor VPS
      const syncResult = await WhatsAppWebService.syncInstances();
      
      if (!syncResult.success) {
        throw new Error(`Erro na sincronização: ${syncResult.error}`);
      }
      
      // 5. Verificar quantas instâncias foram processadas
      const instancesProcessed = syncResult.data?.instances?.length || 0;
      
      console.log('[Intelligent Sync] ✅ Sincronização concluída', {
        instancesLocal: localInstances?.length || 0,
        instancesProcessed,
        serverHealth: healthCheck.data
      });
      
      return {
        success: true,
        instancesProcessed,
        errors: [],
        details: {
          localInstances: localInstances?.length || 0,
          serverInfo: serverInfo.data
        }
      };
      
    } catch (error: any) {
      console.error('[Intelligent Sync] ❌ Erro:', error);
      
      return {
        success: false,
        instancesProcessed: 0,
        errors: [error.message]
      };
    }
  }
}
