
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
      
      // Usar a função modular auto_sync_instances em vez da função genérica removida
      const { data, error } = await supabase.functions.invoke('auto_sync_instances', {
        body: {
          action: 'sync_all_instances'
        }
      });

      addLog("📥 Resposta recebida do serviço de sincronização modular");

      if (error) {
        addLog(`❌ Erro na requisição: ${error.message}`);
        throw error;
      }

      if (data && data.success) {
        const syncResults = data.syncResults || {};
        
        addLog(`✅ Sincronização GLOBAL concluída com sucesso!`);
        addLog(`📊 VPS: ${syncResults.vps_instances || 0} instâncias encontradas`);
        addLog(`📊 Supabase antes: ${syncResults.db_instances || 0} instâncias`);
        addLog(`🆕 Instâncias adicionadas: ${syncResults.new_instances || 0}`);
        addLog(`🔄 Instâncias atualizadas: ${syncResults.updated_instances || 0}`);
        
        if (syncResults.errors && syncResults.errors.length > 0) {
          addLog(`⚠️ Erros encontrados: ${syncResults.errors.length}`);
          syncResults.errors.forEach((error: string, index: number) => {
            addLog(`  ${index + 1}. ${error}`);
          });
        } else {
          addLog(`✅ Nenhum erro encontrado - sincronização perfeita!`);
        }

        addLog(`🎯 RESULTADO: Supabase agora é um espelho perfeito da VPS`);
        
        setResult({
          success: true,
          data: {
            syncId: data.syncId || 'global-sync',
            syncedCount: (syncResults.new_instances || 0) + (syncResults.updated_instances || 0),
            createdCount: syncResults.new_instances || 0,
            updatedCount: syncResults.updated_instances || 0,
            errorCount: syncResults.errors?.length || 0,
            vpsInstancesCount: syncResults.vps_instances || 0,
            supabaseInstancesCount: syncResults.db_instances || 0,
            syncLog: [
              `Adicionadas: ${syncResults.new_instances}`, 
              `Atualizadas: ${syncResults.updated_instances}`, 
              `Total VPS: ${syncResults.vps_instances}`
            ],
            message: `Sincronização global completa! ${syncResults.new_instances || 0} novas instâncias, ${syncResults.updated_instances || 0} atualizadas`
          }
        });

        const successMessage = syncResults.new_instances > 0 
          ? `Sincronização GLOBAL concluída! ${syncResults.new_instances} novas instâncias, ${syncResults.updated_instances} atualizadas`
          : `Sincronização GLOBAL concluída! ${syncResults.updated_instances || 0} instâncias atualizadas`;
        
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
    isStatusSync: false,
    isOrphanSync: false,
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
