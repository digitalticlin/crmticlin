
import { useState, useEffect } from 'react';
import { ConnectionHealthService, ConnectionHealth } from '@/services/whatsapp/services/connectionHealthService';

export const useConnectionHealth = (instanceId?: string) => {
  const [healthStatus, setHealthStatus] = useState<ConnectionHealth | null>(null);
  const [allHealthStatus, setAllHealthStatus] = useState<Map<string, ConnectionHealth>>(new Map());

  // Monitora saúde de uma instância específica - REDUZIDO
  useEffect(() => {
    if (!instanceId) return;

    const checkHealth = () => {
      const status = ConnectionHealthService.getHealthStatus(instanceId);
      setHealthStatus(status);
    };

    // Verifica imediatamente
    checkHealth();

    // INTERVALO MUITO MAIS ESPAÇADO
    const interval = setInterval(checkHealth, 60000); // AUMENTADO para 60 segundos (era 5s)

    return () => {
      clearInterval(interval);
    };
  }, [instanceId]);

  // Monitora todas as instâncias - AINDA MAIS REDUZIDO
  useEffect(() => {
    const checkAllHealth = () => {
      const allStatus = ConnectionHealthService.getAllHealthStatus();
      setAllHealthStatus(new Map(allStatus));
    };

    // Verifica imediatamente
    checkAllHealth();

    // INTERVALO DRASTICAMENTE AUMENTADO
    const interval = setInterval(checkAllHealth, 300000); // AUMENTADO para 5 minutos (era 10s)

    return () => {
      clearInterval(interval);
    };
  }, []);

  const startMonitoring = (instanceId: string, vpsInstanceId: string) => {
    console.log('[useConnectionHealth] MANUAL start monitoring for:', instanceId);
    ConnectionHealthService.startHealthMonitoring(instanceId, vpsInstanceId);
  };

  const stopMonitoring = (instanceId: string) => {
    console.log('[useConnectionHealth] MANUAL stop monitoring for:', instanceId);
    ConnectionHealthService.stopHealthMonitoring(instanceId);
  };

  // NOVA: Verificação manual de saúde
  const manualHealthCheck = async (instanceId: string, vpsInstanceId: string) => {
    console.log('[useConnectionHealth] Manual health check requested for:', instanceId);
    return await ConnectionHealthService.manualHealthCheck(instanceId, vpsInstanceId);
  };

  return {
    healthStatus,
    allHealthStatus,
    startMonitoring,
    stopMonitoring,
    manualHealthCheck, // Nova função
    isHealthy: healthStatus?.isHealthy ?? true,
    consecutiveFailures: healthStatus?.consecutiveFailures ?? 0,
    needsReconnection: healthStatus?.needsReconnection ?? false
  };
};
