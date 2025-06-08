
import { useState, useCallback } from 'react';
import { StatusSyncService } from '@/services/whatsapp/statusSyncService';

export const useStatusSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncInstance = useCallback(async (instanceId: string): Promise<boolean> => {
    setIsSyncing(true);
    try {
      console.log(`[Hook Status Sync] 🔄 Sincronizando instância: ${instanceId}`);
      const success = await StatusSyncService.syncInstanceStatus(instanceId);
      return success;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const syncAllInstances = useCallback(async () => {
    setIsSyncing(true);
    try {
      console.log(`[Hook Status Sync] 🔄 Sincronizando todas as instâncias`);
      const result = await StatusSyncService.syncAllUserInstances();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isSyncing,
    syncInstance,
    syncAllInstances
  };
};
