
import { useCallback, useRef } from 'react';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';

export const useInstanceSync = (companyId: string | null, companyLoading: boolean) => {
  const lastSyncRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  // Função de sync mais conservadora
  const performSync = useCallback(async (force = false) => {
    if (!companyId || companyLoading || !isMountedRef.current) {
      console.log('[Hook] ⏭️ Skipping sync - conditions not met:', { companyId: !!companyId, companyLoading, mounted: isMountedRef.current });
      return;
    }

    const now = Date.now();
    const timeSinceLastSync = now - lastSyncRef.current;
    const MIN_SYNC_INTERVAL = 10000; // 10 segundos

    if (!force && timeSinceLastSync < MIN_SYNC_INTERVAL) {
      console.log(`[Hook] ⏰ Sync throttled - ${Math.round((MIN_SYNC_INTERVAL - timeSinceLastSync) / 1000)}s remaining`);
      return;
    }

    try {
      console.log('[Hook] 🔄 Iniciando sync conservador das instâncias');
      lastSyncRef.current = now;

      const result = await WhatsAppWebService.syncInstances();
      
      if (!isMountedRef.current) {
        console.log('[Hook] Component unmounted during sync');
        return;
      }

      if (result.success) {
        console.log('[Hook] ✅ Sync successful:', result.data?.summary);
        return true;
      } else {
        console.error('[Hook] ❌ Sync failed:', result.error);
        return false;
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('[Hook] ❌ Sync error:', error);
      }
      return false;
    }
  }, [companyId, companyLoading]);

  return {
    performSync,
    isMountedRef
  };
};
