/**
 * 🎯 HOOK COMPATIBILIDADE - WHATSAPP DATABASE
 * 
 * Hook simplificado apenas para compatibilidade com componentes existentes
 * que ainda não foram refatorados. Usa o hook isolado de instâncias.
 */

import { useWhatsAppInstances } from './useWhatsAppInstances';

export const useWhatsAppDatabase = () => {
  const instances = useWhatsAppInstances();
  
  return {
    instances: instances.instances,
    isLoading: instances.isLoading,
    error: instances.error,
    getActiveInstance: () => instances.activeInstance,
    getInstanceForLead: instances.getInstanceForLead,
    connectedInstances: instances.connectedInstances,
    totalInstances: instances.totalInstances,
    healthScore: instances.healthScore,
    isHealthy: instances.isHealthy,
    refetch: instances.refetch,
    cacheStats: {
      // Compatibilidade para componentes antigos
      activeInstancesCount: instances.connectedInstances,
      cacheAge: 0,
      isCacheValid: true,
      reconnectAttempts: 0,
      queuedMessages: 0
    }
  };
};