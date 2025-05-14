
import { useState } from "react";
import { WhatsAppInstance } from "./whatsappInstanceStore";
import { useInstanceStatusChecker } from "./status-monitor/useInstanceStatusChecker";
import { usePriorityMonitor } from "./status-monitor/usePriorityMonitor";
import { usePeriodicChecker } from "./status-monitor/usePeriodicChecker";
import { useConnectionSynchronizer } from "./status-monitor/useConnectionSynchronizer";

/**
 * Main hook for monitoring WhatsApp instance status
 * This hook combines other smaller hooks to provide a complete monitoring solution
 */
export const useWhatsAppStatusMonitor = () => {
  const { checkInstanceStatus, isLoading } = useInstanceStatusChecker();
  const { addConnectingInstance } = usePriorityMonitor();
  const { setupPeriodicStatusCheck } = usePeriodicChecker();
  const { 
    forceSyncConnectionStatus, 
    syncAllInstances, 
    isSyncing 
  } = useConnectionSynchronizer();

  return {
    checkInstanceStatus,
    setupPeriodicStatusCheck,
    addConnectingInstance,
    forceSyncConnectionStatus,
    syncAllInstances,
    isLoading,
    isSyncing
  };
};

// Re-export types from whatsappInstanceStore to maintain compatibility
export type { WhatsAppInstance } from "./whatsappInstanceStore";
