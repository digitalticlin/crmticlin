
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const TestSyncButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const executeDedicatedSync = async () => {
    setIsLoading(true);
    
    try {
      console.log('[Test Sync] 🔄 Executando sync dedicado...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_all_instances'
        }
      });

      if (error) {
        throw error;
      }

      console.log('[Test Sync] ✅ Resultado do sync:', data);
      setLastResult(data);
      
      if (data.success) {
        toast.success(`Sync concluído! ${data.results?.added || 0} adicionadas, ${data.results?.updated || 0} atualizadas`);
      } else {
        toast.error(`Sync falhou: ${data.error}`);
      }
      
    } catch (error: any) {
      console.error('[Test Sync] ❌ Erro:', error);
      toast.error(`Erro no sync: ${error.message}`);
      setLastResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          onClick={executeDedicatedSync}
          disabled={isLoading}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Sincronizando...' : 'Testar Sync Dedicado'}
        </Button>
      </div>

      {lastResult && (
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            {lastResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium">
              {lastResult.success ? 'Sucesso' : 'Falha'}
            </span>
          </div>
          
          {lastResult.summary && (
            <div className="text-sm space-y-1">
              <div>VPS: {lastResult.summary.vps_instances} instâncias</div>
              <div>Supabase: {lastResult.summary.supabase_instances} instâncias</div>
              <div>Órfãs encontradas: {lastResult.summary.orphans_found}</div>
              <div>Adicionadas: {lastResult.summary.added}</div>
              <div>Atualizadas: {lastResult.summary.updated}</div>
              {lastResult.summary.errors_count > 0 && (
                <div className="text-red-600">Erros: {lastResult.summary.errors_count}</div>
              )}
            </div>
          )}
          
          {lastResult.error && (
            <div className="text-red-600 text-sm">
              Erro: {lastResult.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
