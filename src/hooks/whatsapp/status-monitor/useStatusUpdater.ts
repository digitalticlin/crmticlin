
import { useState } from "react";
import { updateInstanceStatusAndPhone } from "../database";
import { updateConnectionAttempt } from "../database/updateConnectionAttempt";
import { WhatsAppConnectionStatus } from "../database/whatsappDatabaseTypes";

/**
 * Hook for managing WhatsApp instance status updates in database
 */
export const useStatusUpdater = () => {
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  
  /**
   * Update instance status in database and store
   */
  const updateInstanceStatus = async (instanceId: string, connectionStatus: string): Promise<boolean> => {
    // Skip for demo instance
    if (instanceId === "1") {
      return true;
    }
    
    try {
      setIsUpdating(prev => ({ ...prev, [instanceId]: true }));
      
      // Convert string status to WhatsAppConnectionStatus type
      const whatsappConnectionStatus: WhatsAppConnectionStatus = connectionStatus === 'open' 
        ? 'open' 
        : connectionStatus === 'connecting' 
          ? 'connecting' 
          : connectionStatus === 'closed'
            ? 'closed'
            : 'disconnected';
      
      // Update connection_status in database
      await updateInstanceStatusAndPhone(instanceId, whatsappConnectionStatus);
      
      // Update global state
      if (window._whatsAppInstancesStore) {
        const updateInstance = window._whatsAppInstancesStore.getState().actions.updateInstance;
        updateInstance(instanceId, { 
          connected: connectionStatus === 'open',
          connection_status: connectionStatus
        });
      }
      
      // Register successful connection
      if (connectionStatus === 'open') {
        await updateConnectionAttempt(instanceId, true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error updating instance status:", error);
      await updateConnectionAttempt(instanceId, false, error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setIsUpdating(prev => ({ ...prev, [instanceId]: false }));
    }
  };

  /**
   * Log connection failure
   */
  const logConnectionFailure = async (instanceId: string, error: unknown) => {
    try {
      await updateConnectionAttempt(instanceId, false, error instanceof Error ? error.message : String(error));
    } catch (logError) {
      console.error("Error logging connection failure:", logError);
    }
  };

  return {
    updateInstanceStatus,
    logConnectionFailure,
    isUpdating
  };
};

// Declare global window types - duplicated here since this file might be used independently
declare global {
  interface Window {
    _whatsAppInstancesState?: {
      instances: any[];
    };
    _whatsAppInstancesStore?: any;
  }
}
