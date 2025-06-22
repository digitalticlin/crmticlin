
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCcw, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const TestSyncButton = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setLastResult(null);
    
    try {
      console.log('[Test Sync] 🚀 Acionando auto_sync_instances...');
      toast.info('Iniciando sincronização com VPS...');

      const { data, error } = await supabase.functions.invoke('auto_sync_instances', {
        body: {
          action: 'sync_all_instances',
          source: 'manual_test'
        }
      });

      if (error) {
        throw new Error(`Erro na Edge Function: ${error.message}`);
      }

      console.log('[Test Sync] ✅ Resultado:', data);
      setLastResult(data);

      if (data?.success) {
        const { syncResults } = data;
        const summary = `VPS: ${syncResults?.vps_instances || 0} instâncias, Banco: ${syncResults?.db_instances || 0} instâncias`;
        const actions = `${syncResults?.new_instances || 0} novas, ${syncResults?.updated_instances || 0} atualizadas`;
        
        toast.success(`Sincronização concluída! ${summary}. ${actions}`);
      } else {
        toast.error(`Erro na sincronização: ${data?.error || 'Erro desconhecido'}`);
      }

    } catch (error: any) {
      console.error('[Test Sync] ❌ Erro:', error);
      toast.error(`Erro: ${error.message}`);
      setLastResult({ success: false, error: error.message });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="bg-blue-50/30 backdrop-blur-sm border border-blue-200/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCcw className="h-5 w-5 text-blue-600" />
          Teste de Sincronização VPS
        </CardTitle>
        <p className="text-sm text-gray-600">
          Aciona auto_sync_instances para sincronizar instâncias da VPS (porta 3002)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Sincronizando VPS...
            </>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Sincronizar Instâncias da VPS
            </>
          )}
        </Button>

        {lastResult && (
          <div className={`p-4 rounded-lg border ${
            lastResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                {lastResult.success ? 'Sincronização Concluída' : 'Erro na Sincronização'}
              </span>
            </div>
            
            {lastResult.success && lastResult.syncResults && (
              <div className="text-sm space-y-1">
                <p>📡 VPS: {lastResult.syncResults.vps_instances || 0} instâncias encontradas</p>
                <p>💾 Banco: {lastResult.syncResults.db_instances || 0} instâncias no banco</p>
                <p>🆕 Novas: {lastResult.syncResults.new_instances || 0}</p>
                <p>🔄 Atualizadas: {lastResult.syncResults.updated_instances || 0}</p>
                {lastResult.syncResults.errors?.length > 0 && (
                  <p>⚠️ Erros: {lastResult.syncResults.errors.length}</p>
                )}
              </div>
            )}
            
            {!lastResult.success && (
              <p className="text-sm text-red-700">{lastResult.error}</p>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>🎯 Esta função testa a comunicação com a VPS na porta 3002</p>
          <p>📊 Mostra quantas instâncias existem na VPS vs Banco</p>
          <p>🔧 Útil para diagnosticar problemas de sincronização</p>
        </div>
      </CardContent>
    </Card>
  );
};
