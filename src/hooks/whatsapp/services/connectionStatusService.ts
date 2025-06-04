
import { useCallback, useRef } from 'react';

// FASE 2: Unificação e Gestão de Status de Conexão
export type UnifiedConnectionStatus = 
  | 'disconnected'    // Completamente desconectado
  | 'connecting'      // Tentando conectar
  | 'waiting_scan'    // Aguardando leitura do QR Code
  | 'ready'          // Conectado e pronto para enviar mensagens
  | 'open'           // Conectado e ativo
  | 'error'          // Erro de conexão
  | 'timeout'        // Timeout na conexão
  | 'maintenance';   // Em manutenção

interface ConnectionState {
  status: UnifiedConnectionStatus;
  lastUpdate: number;
  errorMessage?: string;
  retryCount: number;
  heartbeatActive: boolean;
}

export const useConnectionStatusManager = () => {
  const connectionStatesRef = useRef<Map<string, ConnectionState>>(new Map());
  const heartbeatIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Mapear status da VPS para status unificado
  const mapVPSStatusToUnified = useCallback((vpsStatus: string, webStatus?: string): UnifiedConnectionStatus => {
    console.log(`[Status Manager] 🔄 Mapeando status VPS: ${vpsStatus}, Web: ${webStatus}`);
    
    // Priorizar status mais específico quando disponível
    const statusToMap = webStatus && webStatus !== 'unknown' ? webStatus : vpsStatus;
    
    switch (statusToMap?.toLowerCase()) {
      case 'ready':
      case 'open':
        return 'ready';
      case 'connecting':
      case 'initializing':
        return 'connecting';
      case 'waiting_scan':
      case 'qr_ready':
      case 'waiting_for_scan':
        return 'waiting_scan';
      case 'disconnected':
      case 'closed':
      case 'logout':
        return 'disconnected';
      case 'error':
      case 'failed':
        return 'error';
      case 'timeout':
        return 'timeout';
      default:
        console.warn(`[Status Manager] ⚠️ Status desconhecido: ${statusToMap}, assumindo disconnected`);
        return 'disconnected';
    }
  }, []);

  // Atualizar status de uma instância
  const updateInstanceStatus = useCallback((
    instanceId: string, 
    vpsStatus: string, 
    webStatus?: string,
    errorMessage?: string
  ) => {
    const unifiedStatus = mapVPSStatusToUnified(vpsStatus, webStatus);
    const currentState = connectionStatesRef.current.get(instanceId);
    const now = Date.now();

    const newState: ConnectionState = {
      status: unifiedStatus,
      lastUpdate: now,
      errorMessage,
      retryCount: currentState?.retryCount || 0,
      heartbeatActive: ['ready', 'open'].includes(unifiedStatus)
    };

    // Incrementar retry count se mudou para erro
    if (unifiedStatus === 'error' && currentState?.status !== 'error') {
      newState.retryCount = (currentState?.retryCount || 0) + 1;
    }

    // Reset retry count se conectou com sucesso
    if (['ready', 'open'].includes(unifiedStatus)) {
      newState.retryCount = 0;
    }

    connectionStatesRef.current.set(instanceId, newState);

    console.log(`[Status Manager] 📊 Status atualizado para ${instanceId}:`, {
      previous: currentState?.status,
      current: unifiedStatus,
      retryCount: newState.retryCount,
      timeSinceLastUpdate: currentState ? now - currentState.lastUpdate : 0
    });

    // Gerenciar heartbeat
    if (newState.heartbeatActive && !heartbeatIntervalsRef.current.has(instanceId)) {
      startHeartbeat(instanceId);
    } else if (!newState.heartbeatActive && heartbeatIntervalsRef.current.has(instanceId)) {
      stopHeartbeat(instanceId);
    }

    return newState;
  }, [mapVPSStatusToUnified]);

  // Iniciar heartbeat para monitoramento
  const startHeartbeat = useCallback((instanceId: string) => {
    console.log(`[Status Manager] 💓 Iniciando heartbeat para ${instanceId}`);
    
    const interval = setInterval(() => {
      const state = connectionStatesRef.current.get(instanceId);
      if (!state || !state.heartbeatActive) {
        stopHeartbeat(instanceId);
        return;
      }

      const timeSinceUpdate = Date.now() - state.lastUpdate;
      const HEARTBEAT_TIMEOUT = 300000; // 5 minutos

      if (timeSinceUpdate > HEARTBEAT_TIMEOUT) {
        console.warn(`[Status Manager] ⚠️ Heartbeat timeout para ${instanceId}`);
        updateInstanceStatus(instanceId, 'timeout', undefined, 'Heartbeat timeout');
      }
    }, 60000); // Check a cada minuto

    heartbeatIntervalsRef.current.set(instanceId, interval);
  }, [updateInstanceStatus]);

  // Parar heartbeat
  const stopHeartbeat = useCallback((instanceId: string) => {
    const interval = heartbeatIntervalsRef.current.get(instanceId);
    if (interval) {
      clearInterval(interval);
      heartbeatIntervalsRef.current.delete(instanceId);
      console.log(`[Status Manager] 💔 Heartbeat parado para ${instanceId}`);
    }
  }, []);

  // Obter status atual de uma instância
  const getInstanceStatus = useCallback((instanceId: string): ConnectionState | null => {
    return connectionStatesRef.current.get(instanceId) || null;
  }, []);

  // Obter todas as instâncias com seus status
  const getAllInstancesStatus = useCallback(() => {
    const result: Record<string, ConnectionState> = {};
    connectionStatesRef.current.forEach((state, instanceId) => {
      result[instanceId] = state;
    });
    return result;
  }, []);

  // Verificar se instância deve tentar reconectar
  const shouldRetryConnection = useCallback((instanceId: string): boolean => {
    const state = connectionStatesRef.current.get(instanceId);
    if (!state) return true;

    const MAX_RETRIES = 5;
    const RETRY_COOLDOWN = 300000; // 5 minutos
    const timeSinceLastUpdate = Date.now() - state.lastUpdate;

    return state.retryCount < MAX_RETRIES && 
           timeSinceLastUpdate > RETRY_COOLDOWN &&
           ['error', 'timeout', 'disconnected'].includes(state.status);
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    console.log('[Status Manager] 🧹 Limpando heartbeats ativos');
    heartbeatIntervalsRef.current.forEach((interval) => {
      clearInterval(interval);
    });
    heartbeatIntervalsRef.current.clear();
    connectionStatesRef.current.clear();
  }, []);

  return {
    updateInstanceStatus,
    getInstanceStatus,
    getAllInstancesStatus,
    shouldRetryConnection,
    mapVPSStatusToUnified,
    cleanup
  };
};
