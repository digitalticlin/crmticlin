
import { useCallback, useRef } from 'react';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';
import { VPS_CONFIG } from '@/services/whatsapp/config/vpsConfig';
import { loopDetection } from './loopDetectionService';

// FASE 3: Sync Inteligente com detecção de loops
export const useIntelligentSync = (companyId: string | null, companyLoading: boolean) => {
  const lastSyncDataRef = useRef<{
    instancesHash: string;
    timestamp: number;
  }>({ instancesHash: '', timestamp: 0 });
  
  const isMountedRef = useRef(true);
  const syncInProgressRef = useRef(false);

  // Gerar hash dos dados para detectar mudanças reais
  const generateInstancesHash = (instances: any[]) => {
    const relevantData = instances.map(i => ({
      id: i.instanceId,
      status: i.status,
      phone: i.phone,
      profileName: i.profileName
    }));
    return btoa(JSON.stringify(relevantData));
  };

  // Sync inteligente com proteção contra loops
  const performIntelligentSync = useCallback(async (force = false) => {
    // FASE 3: Verificar proteção contra loops
    const syncEndpoint = 'intelligent-sync';
    
    if (!loopDetection.recordRequest(syncEndpoint)) {
      console.warn('[Intelligent Sync] 🔄 Sync bloqueado por detecção de loop');
      return { success: false, reason: 'loop_detected', blocked: true };
    }

    if (!companyId || companyLoading || !isMountedRef.current) {
      console.log('[Intelligent Sync] ⏭️ Condições não atendidas para sync');
      return { success: false, reason: 'conditions_not_met' };
    }

    if (syncInProgressRef.current && !force) {
      console.log('[Intelligent Sync] ⏸️ Sync já em progresso');
      return { success: false, reason: 'sync_in_progress' };
    }

    const now = Date.now();
    const timeSinceLastSync = now - lastSyncDataRef.current.timestamp;
    const MIN_INTELLIGENT_INTERVAL = VPS_CONFIG.sync.interval * 0.5; // 90 segundos mínimo

    if (!force && timeSinceLastSync < MIN_INTELLIGENT_INTERVAL) {
      console.log(`[Intelligent Sync] ⏰ Throttled - ${Math.round((MIN_INTELLIGENT_INTERVAL - timeSinceLastSync) / 1000)}s restantes`);
      return { success: false, reason: 'throttled' };
    }

    syncInProgressRef.current = true;

    try {
      console.log('[Intelligent Sync] 🧠 Iniciando sync inteligente FASE 3 (com proteção anti-loop)');
      
      // Primeiro, buscar estado atual da VPS
      const vpsResult = await WhatsAppWebService.getServerInfo();
      
      if (!vpsResult.success) {
        console.log('[Intelligent Sync] ❌ VPS inacessível, mantendo estado atual');
        return { success: false, reason: 'vps_unreachable', error: vpsResult.error };
      }

      // Verificar se houve mudanças comparando hash
      const currentHash = generateInstancesHash(vpsResult.instances || []);
      const hasChanges = currentHash !== lastSyncDataRef.current.instancesHash;

      if (!force && !hasChanges) {
        console.log('[Intelligent Sync] ➡️ Nenhuma mudança detectada, sync desnecessário');
        lastSyncDataRef.current.timestamp = now;
        return { success: true, reason: 'no_changes_detected', skipped: true };
      }

      console.log('[Intelligent Sync] 🔄 Mudanças detectadas, executando sync completo');
      
      // Executar sync completo
      const syncResult = await WhatsAppWebService.syncInstances();
      
      if (syncResult.success) {
        // Atualizar hash e timestamp apenas em caso de sucesso
        lastSyncDataRef.current = {
          instancesHash: currentHash,
          timestamp: now
        };
        
        console.log('[Intelligent Sync] ✅ Sync inteligente concluído com sucesso');
        console.log('[Intelligent Sync] 📊 Resumo:', syncResult.data?.summary);
        
        return { 
          success: true, 
          reason: 'changes_synced',
          summary: syncResult.data?.summary,
          changesDetected: hasChanges,
          loopStats: loopDetection.getEndpointStats(syncEndpoint)
        };
      } else {
        console.error('[Intelligent Sync] ❌ Falha no sync:', syncResult.error);
        return { success: false, reason: 'sync_failed', error: syncResult.error };
      }

    } catch (error) {
      console.error('[Intelligent Sync] 💥 Erro inesperado:', error);
      return { success: false, reason: 'unexpected_error', error: error.message };
    } finally {
      syncInProgressRef.current = false;
    }
  }, [companyId, companyLoading]);

  // Reset do estado quando componente desmonta
  const cleanup = useCallback(() => {
    isMountedRef.current = false;
    syncInProgressRef.current = false;
    console.log('[Intelligent Sync] 🧹 Cleanup executado');
  }, []);

  // Força um novo sync resetando o hash
  const forceFullSync = useCallback(async () => {
    console.log('[Intelligent Sync] 🔄 Forçando sync completo');
    lastSyncDataRef.current.instancesHash = ''; // Reset hash para forçar sync
    return await performIntelligentSync(true);
  }, [performIntelligentSync]);

  // Obter estatísticas de loops
  const getLoopStats = useCallback(() => {
    return loopDetection.getAllStats();
  }, []);

  return {
    performIntelligentSync,
    forceFullSync,
    cleanup,
    isInProgress: () => syncInProgressRef.current,
    getLastSyncInfo: () => lastSyncDataRef.current,
    getLoopStats // NOVO: estatísticas de detecção de loops
  };
};
