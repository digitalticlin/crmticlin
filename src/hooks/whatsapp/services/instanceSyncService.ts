
import { useCallback, useRef } from 'react';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';
import { VPS_CONFIG } from '@/services/whatsapp/config/vpsConfig';

// FASE 1: Sync Service melhorado com debounce e controle de frequência
export const useInstanceSync = (companyId: string | null, companyLoading: boolean) => {
  const lastSyncRef = useRef<number>(0);
  const isMountedRef = useRef(true);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const syncInProgressRef = useRef(false);

  // Função de sync estabilizada - FASE 1
  const performSync = useCallback(async (force = false) => {
    if (!companyId || companyLoading || !isMountedRef.current) {
      console.log('[Sync] ⏭️ Sync ignorado - condições não atendidas:', { 
        companyId: !!companyId, 
        companyLoading, 
        mounted: isMountedRef.current 
      });
      return false;
    }

    // Evitar sync simultâneo
    if (syncInProgressRef.current && !force) {
      console.log('[Sync] ⏸️ Sync já em progresso, ignorando...');
      return false;
    }

    const now = Date.now();
    const timeSinceLastSync = now - lastSyncRef.current;
    const MIN_SYNC_INTERVAL = VPS_CONFIG.sync.interval; // 3 minutos

    if (!force && timeSinceLastSync < MIN_SYNC_INTERVAL) {
      const remainingTime = Math.round((MIN_SYNC_INTERVAL - timeSinceLastSync) / 1000);
      console.log(`[Sync] ⏰ Sync throttled - ${remainingTime}s restantes (intervalo: ${MIN_SYNC_INTERVAL/1000}s)`);
      return false;
    }

    syncInProgressRef.current = true;

    try {
      console.log('[Sync] 🔄 Iniciando sync estabilizado (Fase 1)');
      console.log('[Sync] 📊 Parâmetros:', {
        companyId,
        force,
        timeSinceLastSync: Math.round(timeSinceLastSync / 1000) + 's',
        interval: MIN_SYNC_INTERVAL / 1000 + 's'
      });

      lastSyncRef.current = now;

      const result = await WhatsAppWebService.syncInstances();
      
      if (!isMountedRef.current) {
        console.log('[Sync] ⚠️ Componente desmontado durante sync');
        return false;
      }

      if (result.success) {
        console.log('[Sync] ✅ Sync bem-sucedido (Fase 1):', result.data?.summary);
        
        // Log detalhado para debug
        if (result.data?.summary) {
          const { updated, preserved, adopted, errors } = result.data.summary;
          console.log('[Sync] 📈 Estatísticas:', {
            atualizada: updated,
            preservadas: preserved,
            adotadas: adopted,
            erros: errors
          });
        }
        
        return true;
      } else {
        console.error('[Sync] ❌ Sync falhou:', result.error);
        return false;
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('[Sync] 💥 Erro durante sync:', error);
      }
      return false;
    } finally {
      syncInProgressRef.current = false;
    }
  }, [companyId, companyLoading]);

  // Sync com debounce para evitar múltiplas chamadas
  const debouncedSync = useCallback((force = false) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      performSync(force);
    }, VPS_CONFIG.sync.debounceDelay);
  }, [performSync]);

  // Cleanup melhorado
  const cleanup = useCallback(() => {
    isMountedRef.current = false;
    syncInProgressRef.current = false;
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    console.log('[Sync] 🧹 Cleanup executado');
  }, []);

  return {
    performSync,
    debouncedSync,
    isMountedRef,
    cleanup,
    isInProgress: () => syncInProgressRef.current
  };
};
