import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SyncResult } from "../types";

export const useSyncOperations = (addLog: (message: string) => void) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isStatusSync, setIsStatusSync] = useState(false);
  const [isOrphanSync, setIsOrphanSync] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const executeGlobalSync = async () => {
    setIsRunning(true);
    setResult(null);
    
    addLog("🚀 Iniciando sincronização GLOBAL COMPLETA VPS ↔ Supabase...");
    addLog("📡 Esta operação sincroniza TODAS as instâncias (incluindo órfãs)...");

    try {
      addLog("🔐 Verificando autenticação...");
      
      // **CORREÇÃO**: Chamar a nova ação sync_all_instances
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_all_instances' // **NOVA AÇÃO**: Sincronização global completa
        }
      });

      addLog("📥 Resposta recebida do servidor global");

      if (error) {
        addLog(`❌ Erro na requisição: ${error.message}`);
        throw error;
      }

      if (data && data.success) {
        const summary = data.summary || {};
        const results = data.results || {};
        
        addLog(`✅ Sincronização GLOBAL concluída com sucesso!`);
        addLog(`📊 VPS: ${summary.vps_instances || 0} instâncias encontradas`);
        addLog(`📊 Supabase: ${summary.supabase_instances || 0} instâncias existentes`);
        addLog(`🆕 Órfãs importadas: ${results.added || 0} (created_by_user_id: NULL)`);
        addLog(`🔄 Status atualizados: ${results.updated || 0}`);
        addLog(`🔗 Vínculos preservados: ${results.preserved_links || 0}`);
        addLog(`⚰️ Instâncias mortas marcadas: ${results.marked_dead || 0}`);
        
        if (results.errors && results.errors.length > 0) {
          addLog(`⚠️ Erros encontrados: ${results.errors.length}`);
          results.errors.forEach((error: any, index: number) => {
            addLog(`  ${index + 1}. ${error.vpsId || 'unknown'}: ${error.error}`);
          });
        }

        addLog(`⏱️ Tempo de execução: ${data.execution_time_ms || 0}ms`);
        
        setResult({
          success: true,
          data: {
            syncId: data.syncId || 'global-sync',
            syncedCount: (results.added || 0) + (results.updated || 0),
            createdCount: results.added || 0,
            updatedCount: results.updated || 0,
            errorCount: results.errors?.length || 0,
            vpsInstancesCount: summary.vps_instances || 0,
            supabaseInstancesCount: summary.supabase_instances || 0,
            syncLog: [`Órfãs: ${results.added}`, `Atualizadas: ${results.updated}`, `Preservadas: ${results.preserved_links}`],
            message: `Sincronização global completa! ${results.added || 0} órfãs importadas, ${results.updated || 0} atualizadas`
          }
        });

        const successMessage = results.added > 0 
          ? `Sincronização GLOBAL concluída! ${results.added} órfãs importadas, ${results.updated} atualizadas`
          : `Sincronização GLOBAL concluída! ${results.updated || 0} instâncias atualizadas`;
        
        toast.success(successMessage);
      } else {
        const errorMessage = data?.error || 'Erro desconhecido na sincronização global';
        addLog(`❌ Falha na sincronização global: ${errorMessage}`);
        
        setResult({
          success: false,
          error: errorMessage
        });
        
        toast.error(`Falha na sincronização global: ${errorMessage}`);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro inesperado';
      addLog(`💥 Erro inesperado na sincronização global: ${errorMessage}`);
      
      setResult({
        success: false,
        error: errorMessage
      });
      
      toast.error(`Erro na sincronização global: ${errorMessage}`);
    } finally {
      setIsRunning(false);
      addLog("🏁 Processo de sincronização GLOBAL finalizado");
    }
  };

  const executeStatusSync = async () => {
    setIsStatusSync(true);
    setResult(null);
    
    addLog("🔧 Iniciando sincronização de status e configuração de webhooks...");
    addLog("⚙️ Configurando webhooks na VPS e atualizando status...");

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_status_webhooks'
        }
      });

      if (error) {
        addLog(`❌ Erro na requisição: ${error.message}`);
        throw error;
      }

      if (data && data.success) {
        const summary = data.data || {};
        
        addLog(`✅ Sincronização de status concluída!`);
        addLog(`🔗 Webhooks configurados: ${summary.webhooksConfigured || 0}`);
        addLog(`🔄 Status atualizados: ${summary.statusUpdated || 0}`);
        addLog(`📊 Instâncias processadas: ${summary.processedCount || 0}`);
        
        setResult({
          success: true,
          data: {
            syncId: summary.syncId || 'status-sync',
            syncedCount: summary.statusUpdated || 0,
            createdCount: 0,
            updatedCount: summary.statusUpdated || 0,
            errorCount: summary.errorCount || 0,
            vpsInstancesCount: summary.processedCount || 0,
            supabaseInstancesCount: summary.statusUpdated || 0,
            syncLog: summary.syncLog || [],
            message: 'Webhooks configurados e status sincronizados com sucesso'
          }
        });

        toast.success(`Status sincronizado! ${summary.statusUpdated || 0} instâncias atualizadas`);
      } else {
        const errorMessage = data?.error || 'Erro desconhecido na sincronização de status';
        addLog(`❌ Falha na sincronização: ${errorMessage}`);
        
        setResult({
          success: false,
          error: errorMessage
        });
        
        toast.error(`Falha na sincronização: ${errorMessage}`);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro inesperado';
      addLog(`💥 Erro inesperado: ${errorMessage}`);
      
      setResult({
        success: false,
        error: errorMessage
      });
      
      toast.error(`Erro na sincronização: ${errorMessage}`);
    } finally {
      setIsStatusSync(false);
      addLog("🏁 Sincronização de status finalizada");
    }
  };

  const executeOrphanSync = async () => {
    setIsOrphanSync(true);
    setResult(null);
    
    addLog("👥 Iniciando sincronização de instâncias órfãs...");
    addLog("🔍 Buscando instâncias não vinculadas na VPS...");

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_orphan_instances'
        }
      });

      if (error) {
        addLog(`❌ Erro na requisição: ${error.message}`);
        throw error;
      }

      if (data && data.success) {
        const summary = data.data || {};
        
        addLog(`✅ Sincronização de órfãs concluída!`);
        addLog(`🆕 Órfãs importadas: ${summary.orphansImported || 0}`);
        addLog(`🔄 Órfãs atualizadas: ${summary.orphansUpdated || 0}`);
        addLog(`📊 Total processadas: ${summary.totalProcessed || 0}`);
        
        setResult({
          success: true,
          data: {
            syncId: summary.syncId || 'orphan-sync',
            syncedCount: summary.orphansImported || 0,
            createdCount: summary.orphansImported || 0,
            updatedCount: summary.orphansUpdated || 0,
            errorCount: summary.errorCount || 0,
            vpsInstancesCount: summary.totalProcessed || 0,
            supabaseInstancesCount: summary.orphansImported || 0,
            syncLog: summary.syncLog || [],
            message: 'Instâncias órfãs importadas com sucesso'
          }
        });

        toast.success(`Órfãs sincronizadas! ${summary.orphansImported || 0} instâncias importadas`);
      } else {
        const errorMessage = data?.error || 'Erro desconhecido na sincronização de órfãs';
        addLog(`❌ Falha na sincronização: ${errorMessage}`);
        
        setResult({
          success: false,
          error: errorMessage
        });
        
        toast.error(`Falha na sincronização: ${errorMessage}`);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro inesperado';
      addLog(`💥 Erro inesperado: ${errorMessage}`);
      
      setResult({
        success: false,
        error: errorMessage
      });
      
      toast.error(`Erro na sincronização: ${errorMessage}`);
    } finally {
      setIsOrphanSync(false);
      addLog("🏁 Sincronização de órfãs finalizada");
    }
  };

  return {
    isRunning,
    isStatusSync,
    isOrphanSync,
    result,
    executeGlobalSync,
    executeStatusSync,
    executeOrphanSync
  };
};
