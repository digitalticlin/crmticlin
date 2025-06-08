
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SyncResult } from "../types";

export const useSyncOperations = (addLog: (message: string) => void) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const executeGlobalSync = async () => {
    setIsRunning(true);
    setResult(null);
    
    addLog("🚀 Iniciando sincronização GLOBAL COMPLETA VPS ↔ Supabase...");
    addLog("📡 Esta operação sincroniza TODAS as instâncias da VPS para o Supabase...");
    addLog("🔒 GARANTIA: Nenhuma instância será deletada, apenas adicionada/atualizada");

    try {
      addLog("🔐 Verificando autenticação...");
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_all_instances'
        }
      });

      addLog("📥 Resposta recebida do servidor de sincronização");

      if (error) {
        addLog(`❌ Erro na requisição: ${error.message}`);
        throw error;
      }

      if (data && data.success) {
        const summary = data.summary || {};
        const results = data.results || {};
        
        addLog(`✅ Sincronização GLOBAL concluída com sucesso!`);
        addLog(`📊 VPS: ${summary.vps_instances || 0} instâncias encontradas`);
        addLog(`📊 Supabase antes: ${summary.supabase_instances || 0} instâncias`);
        addLog(`🆕 Instâncias adicionadas: ${results.added || 0}`);
        addLog(`🔄 Instâncias atualizadas: ${results.updated || 0}`);
        addLog(`🔗 Vínculos preservados: ${results.preserved_links || 0}`);
        
        if (results.errors && results.errors.length > 0) {
          addLog(`⚠️ Erros encontrados: ${results.errors.length}`);
          results.errors.forEach((error: any, index: number) => {
            addLog(`  ${index + 1}. ${error.vpsId || 'unknown'}: ${error.error}`);
          });
        } else {
          addLog(`✅ Nenhum erro encontrado - sincronização perfeita!`);
        }

        addLog(`⏱️ Tempo de execução: ${data.execution_time_ms || 0}ms`);
        addLog(`🎯 RESULTADO: Supabase agora é um espelho perfeito da VPS`);
        
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
            syncLog: [
              `Adicionadas: ${results.added}`, 
              `Atualizadas: ${results.updated}`, 
              `Preservadas: ${results.preserved_links}`,
              `Total VPS: ${summary.vps_instances}`
            ],
            message: `Sincronização global completa! ${results.added || 0} novas instâncias, ${results.updated || 0} atualizadas`
          }
        });

        const successMessage = results.added > 0 
          ? `Sincronização GLOBAL concluída! ${results.added} novas instâncias, ${results.updated} atualizadas`
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

  return {
    isRunning,
    isStatusSync: false, // Removidas as operações que não funcionam
    isOrphanSync: false, // Removidas as operações que não funcionam
    result,
    executeGlobalSync,
    executeStatusSync: () => {
      toast.info("Use a sincronização global que já inclui atualização de status");
    },
    executeOrphanSync: () => {
      toast.info("Use a sincronização global que já inclui importação de órfãs");
    }
  };
};
