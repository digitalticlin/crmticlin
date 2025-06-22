
import { useSyncLogs } from "./sync/hooks/useSyncLogs";
import { useSyncOperations } from "./sync/hooks/useSyncOperations";
import { SyncControls } from "./sync/SyncControls";
import { SyncResults } from "./sync/SyncResults";
import { SyncLogs } from "./sync/SyncLogs";
import { SyncInfo } from "./sync/SyncInfo";
import { useInstanceSyncManager } from "@/hooks/whatsapp/useInstanceSyncManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Loader2, Sync } from "lucide-react";

export const GlobalInstanceSync = () => {
  const { logs, addLog, clearLogs } = useSyncLogs();
  const {
    isRunning,
    isStatusSync,
    isOrphanSync,
    result,
    executeGlobalSync,
    executeStatusSync,
    executeOrphanSync
  } = useSyncOperations(addLog);

  // Adicionar hook para nova funcionalidade
  const { syncAllInstances, isSyncing } = useInstanceSyncManager();

  const handleGlobalSync = () => {
    clearLogs();
    executeGlobalSync();
  };

  const handleStatusSync = () => {
    clearLogs();
    executeStatusSync();
  };

  const handleOrphanSync = () => {
    clearLogs();
    executeOrphanSync();
  };

  // Nova função para sincronização via instanceSyncService
  const handleInstanceSync = async () => {
    clearLogs();
    addLog("🚀 Iniciando sincronização via Instance Sync Service...");
    await syncAllInstances();
  };

  return (
    <div className="space-y-6">
      <SyncControls
        isRunning={isRunning}
        isStatusSync={isStatusSync}
        isOrphanSync={isOrphanSync}
        onGlobalSync={handleGlobalSync}
        onStatusSync={handleStatusSync}
        onOrphanSync={handleOrphanSync}
      />

      {/* Novo controle para Instance Sync */}
      <Card className="bg-green-50/30 backdrop-blur-xl rounded-3xl border border-green-200/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sync className="h-5 w-5 text-green-500" />
            Sincronização Modular (Instance Sync)
          </CardTitle>
          <p className="text-sm text-gray-600">
            Nova estrutura modular para sincronização VPS ↔ Supabase
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleInstanceSync}
            disabled={isSyncing}
            className="gap-2 w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sincronizando via Instance Sync...
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4" />
                Sincronizar via Instance Sync Service
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && <SyncResults result={result} />}

      <SyncLogs logs={logs} />

      <SyncInfo />
    </div>
  );
};
