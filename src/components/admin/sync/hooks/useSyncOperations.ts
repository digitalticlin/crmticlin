
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
    
    addLog("🚀 Iniciando sincronização global de instâncias...");
    addLog("📡 Esta operação pode levar alguns segundos...");

    try {
      addLog("🔐 Verificando autenticação...");
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_all_instances'
        }
      });

      addLog("📥 Resposta recebida do servidor");

      if (error) {
        addLog(`❌ Erro na requisição: ${error.message}`);
        throw error;
      }

      if (data && data.success) {
        const summary = data.data || data.summary || {};
        
        addLog(`✅ Sincronização concluída com sucesso!`);
        addLog(`🆕 Instâncias criadas: ${summary.createdCount || summary.created || 0}`);
        addLog(`🔄 Instâncias atualizadas: ${summary.updatedCount || summary.updated || 0}`);
        addLog(`📊 Total VPS: ${summary.vpsInstancesCount || summary.total_vps_instances || 0}`);
        addLog(`💾 Total Supabase: ${summary.supabaseInstancesCount || summary.total_db_instances || 0}`);
        
        if (summary.errorCount && summary.errorCount > 0) {
          addLog(`⚠️ Erros encontrados: ${summary.errorCount}`);
        }

        if (summary.syncLog && Array.isArray(summary.syncLog)) {
          addLog("📋 Detalhes da sincronização:");
          summary.syncLog.forEach((logEntry: string) => {
            addLog(`  ${logEntry}`);
          });
        }
        
        setResult({
          success: true,
          data: {
            syncId: summary.syncId || 'unknown',
            syncedCount: summary.syncedCount || (summary.updatedCount + summary.createdCount) || 0,
            createdCount: summary.createdCount || summary.created || 0,
            updatedCount: summary.updatedCount || summary.updated || 0,
            errorCount: summary.errorCount || 0,
            vpsInstancesCount: summary.vpsInstancesCount || summary.total_vps_instances || 0,
            supabaseInstancesCount: summary.supabaseInstancesCount || summary.total_db_instances || 0,
            syncLog: summary.syncLog || [],
            message: data.message || summary.message || 'Sincronização global executada com sucesso'
          }
        });

        const successMessage = summary.createdCount > 0 
          ? `Sincronização concluída! ${summary.createdCount} instâncias órfãs adicionadas ao Supabase`
          : `Sincronização concluída! ${summary.updatedCount || 0} instâncias atualizadas`;
        
        toast.success(successMessage);
      } else {
        const errorMessage = data?.error || 'Erro desconhecido na sincronização';
        addLog(`❌ Falha na sincronização: ${errorMessage}`);
        
        if (data?.details) {
          addLog("🔍 Dados de debug do erro:");
          addLog(`   VPS URL: ${data.details.vps_url || 'N/A'}`);
          addLog(`   Headers: ${JSON.stringify(data.details.vps_headers || {})}`);
        }
        
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
      setIsRunning(false);
      addLog("🏁 Processo de sincronização finalizado");
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
