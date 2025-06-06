
import { useSyncLogs } from "./sync/hooks/useSyncLogs";
import { useSyncOperations } from "./sync/hooks/useSyncOperations";
import { SyncControls } from "./sync/SyncControls";
import { SyncResults } from "./sync/SyncResults";
import { SyncLogs } from "./sync/SyncLogs";
import { SyncInfo } from "./sync/SyncInfo";

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

      {result && <SyncResults result={result} />}

      <SyncLogs logs={logs} />

      <SyncInfo />
    </div>
  );
};
