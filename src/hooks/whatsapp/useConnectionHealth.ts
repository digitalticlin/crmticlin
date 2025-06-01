
import { useState, useEffect } from 'react';
import { ConnectionHealthService, ConnectionHealth } from '@/services/whatsapp/services/connectionHealthService';

export const useConnectionHealth = (instanceId?: string) => {
  const [healthStatus, setHealthStatus] = useState<ConnectionHealth | null>(null);
  const [allHealthStatus, setAllHealthStatus] = useState<Map<string, ConnectionHealth>>(new Map());

  // Monitora saúde de uma instância específica
  useEffect(() => {
    if (!instanceId) return;

    const checkHealth = () => {
      const status = ConnectionHealthService.getHealthStatus(instanceId);
      setHealthStatus(status);
    };

    // Verifica imediatamente
    checkHealth();

    // Verifica periodicamente
    const interval = setInterval(checkHealth, 5000); // A cada 5 segundos

    return () => {
      clearInterval(interval);
    };
  }, [instanceId]);

  // Monitora todas as instâncias
  useEffect(() => {
    const checkAllHealth = () => {
      const allStatus = ConnectionHealthService.getAllHealthStatus();
      setAllHealthStatus(new Map(allStatus));
    };

    // Verifica imediatamente
    checkAllHealth();

    // Verifica periodicamente
    const interval = setInterval(checkAllHealth, 10000); // A cada 10 segundos

    return () => {
      clearInterval(interval);
    };
  }, []);

  const startMonitoring = (instanceId: string, vpsInstanceId: string) => {
    ConnectionHealthService.startHealthMonitoring(instanceId, vpsInstanceId);
  };

  const stopMonitoring = (instanceId: string) => {
    ConnectionHealthService.stopHealthMonitoring(instanceId);
  };

  return {
    healthStatus,
    allHealthStatus,
    startMonitoring,
    stopMonitoring,
    isHealthy: healthStatus?.isHealthy ?? true,
    consecutiveFailures: healthStatus?.consecutiveFailures ?? 0,
    needsReconnection: healthStatus?.needsReconnection ?? false
  };
};
