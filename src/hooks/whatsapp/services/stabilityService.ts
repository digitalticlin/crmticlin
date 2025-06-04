
import { useCallback, useRef } from 'react';
import { VPS_CONFIG } from '@/services/whatsapp/config/vpsConfig';

interface StabilityState {
  isVPSHealthy: boolean;
  lastHealthCheck: number;
  consecutiveFailures: number;
  backoffMultiplier: number;
  isInBackoff: boolean;
  syncBlocked: boolean;
}

// NOVO: Serviço de estabilidade para prevenir loops infinitos
export const useStabilityService = () => {
  const stabilityStateRef = useRef<StabilityState>({
    isVPSHealthy: false,
    lastHealthCheck: 0,
    consecutiveFailures: 0,
    backoffMultiplier: 1,
    isInBackoff: false,
    syncBlocked: false
  });

  const isMountedRef = useRef(true);

  // Verificar se deve executar operação baseado na estabilidade
  const shouldAllowOperation = useCallback((operationType: 'sync' | 'health' | 'fetch') => {
    const state = stabilityStateRef.current;
    const now = Date.now();
    
    // Se VPS não está saudável e estamos em backoff, bloquear
    if (!state.isVPSHealthy && state.isInBackoff) {
      console.log(`[Stability] 🚫 Operação ${operationType} bloqueada - VPS em backoff`);
      return false;
    }

    // Limitar health checks baseado em falhas consecutivas
    if (operationType === 'health') {
      const minInterval = VPS_CONFIG.sync.healthCheckInterval * state.backoffMultiplier;
      if (now - state.lastHealthCheck < minInterval) {
        console.log(`[Stability] ⏳ Health check em cooldown - ${Math.round((minInterval - (now - state.lastHealthCheck)) / 1000)}s restantes`);
        return false;
      }
    }

    // Bloquear sync se VPS não está saudável
    if (operationType === 'sync' && !state.isVPSHealthy) {
      console.log(`[Stability] 🚫 Sync bloqueado - VPS não saudável`);
      return false;
    }

    return true;
  }, []);

  // Reportar resultado de health check
  const reportHealthCheck = useCallback((success: boolean, error?: string) => {
    const state = stabilityStateRef.current;
    const now = Date.now();
    
    state.lastHealthCheck = now;
    
    if (success) {
      console.log(`[Stability] ✅ VPS saudável - resetando contadores`);
      state.isVPSHealthy = true;
      state.consecutiveFailures = 0;
      state.backoffMultiplier = 1;
      state.isInBackoff = false;
      state.syncBlocked = false;
    } else {
      state.isVPSHealthy = false;
      state.consecutiveFailures++;
      
      // Backoff exponencial limitado
      state.backoffMultiplier = Math.min(state.consecutiveFailures * 2, 16); // Máximo 16x
      state.isInBackoff = true;
      
      console.warn(`[Stability] ❌ VPS falhou ${state.consecutiveFailures}x - backoff: ${state.backoffMultiplier}x`);
      
      // Bloquear sync após 3 falhas consecutivas
      if (state.consecutiveFailures >= 3) {
        state.syncBlocked = true;
        console.warn(`[Stability] 🔒 Sync bloqueado após ${state.consecutiveFailures} falhas`);
      }
      
      // Auto-recovery após período de backoff
      setTimeout(() => {
        if (isMountedRef.current) {
          state.isInBackoff = false;
          console.log(`[Stability] 🔄 Saindo do backoff - permitindo nova tentativa`);
        }
      }, VPS_CONFIG.sync.healthCheckInterval * state.backoffMultiplier);
    }
  }, []);

  // Forçar reset do estado (para uso manual)
  const forceReset = useCallback(() => {
    console.log(`[Stability] 🔄 Reset forçado do estado de estabilidade`);
    stabilityStateRef.current = {
      isVPSHealthy: false,
      lastHealthCheck: 0,
      consecutiveFailures: 0,
      backoffMultiplier: 1,
      isInBackoff: false,
      syncBlocked: false
    };
  }, []);

  // Obter estado atual
  const getStabilityState = useCallback(() => {
    return { ...stabilityStateRef.current };
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    isMountedRef.current = false;
    console.log('[Stability] 🧹 Cleanup executado');
  }, []);

  return {
    shouldAllowOperation,
    reportHealthCheck,
    forceReset,
    getStabilityState,
    cleanup,
    isMountedRef
  };
};
