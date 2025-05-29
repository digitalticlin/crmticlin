
import { useState, useRef } from "react";
import { evolutionApiService } from "@/services/evolution-api";
import { useErrorTracker } from "./useErrorTracker";
import { useDeviceInfoFetcher } from "./useDeviceInfoFetcher";
import { useStatusUpdater } from "./useStatusUpdater";

/**
 * Hook for checking WhatsApp instance status with aggressive throttling to prevent loops
 */
export const useInstanceStatusChecker = () => {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const instanceCheckInProgress = useRef<Record<string, boolean>>({});
  const lastCheckTime = useRef<Record<string, number>>({});
  const globalLastCheck = useRef<number>(0);
  
  const { trackConnectionError, clearErrorTracking } = useErrorTracker();
  const { fetchDeviceInfo, fetchPhoneNumber } = useDeviceInfoFetcher();
  const { updateInstanceStatus, logConnectionFailure } = useStatusUpdater();
  
  // Check instance status with aggressive throttling and concurrency protection
  const checkInstanceStatus = async (instanceId: string, forceFresh: boolean = false) => {
    // Find instance by ID
    const instance = window._whatsAppInstancesState?.instances?.find(i => i.id === instanceId);
    if (!instance || !instance.instanceName) {
      console.error(`Instance not found for ID: ${instanceId}`);
      return "unknown";
    }
    
    const instanceName = instance.instanceName;
    
    // Proteção global contra excesso de verificações
    const now = Date.now();
    const globalMinInterval = 5000; // 5 segundos entre QUALQUER verificação
    if (!forceFresh && now - globalLastCheck.current < globalMinInterval) {
      console.log(`[StatusChecker] Global throttling active - last check was ${now - globalLastCheck.current}ms ago`);
      return;
    }
    
    // Prevent concurrent checks for the same instance
    if (instanceCheckInProgress.current[instanceId]) {
      console.log(`[StatusChecker] Instance ${instanceId} already being checked, skipping`);
      return;
    }
    
    // Throttle individual instance checks: mínimo 15 segundos entre verificações da mesma instância
    const lastCheck = lastCheckTime.current[instanceId] || 0;
    const minInterval = 15000; // 15 segundos para cada instância
    if (!forceFresh && now - lastCheck < minInterval) {
      console.log(`[StatusChecker] Instance ${instanceId} throttled - last check ${now - lastCheck}ms ago`);
      return;
    }
    
    try {
      console.log(`[StatusChecker] Checking status of instance: ${instanceName}`);
      
      // Mark this instance as being checked
      instanceCheckInProgress.current[instanceId] = true;
      lastCheckTime.current[instanceId] = now;
      globalLastCheck.current = now;
      setIsLoading(prev => ({ ...prev, [instanceId]: true }));
      
      // Get current instance status via Evolution API
      const status = await evolutionApiService.checkInstanceStatus(instanceName);
      console.log(`[StatusChecker] Status of instance ${instanceName}: ${status}`);
      
      // If device is connected, get additional device info
      if (status === 'connected') {
        await fetchDeviceInfo(instanceId, instanceName);
        // Clear error tracking since we connected successfully
        clearErrorTracking(instanceId);
      }
      
      // Update status in database
      await updateInstanceStatus(instanceId, status);
      
      return status;
    } catch (error) {
      console.error(`[StatusChecker] Error checking status of instance ${instanceId}:`, error);
      
      // Try fallback for phone number if available
      try {
        await fetchPhoneNumber(instanceId, instanceName);
      } catch (fallbackError) {
        console.error("[StatusChecker] Fallback phone fetch failed:", fallbackError);
      }
      
      // Track error and check if we should continue with frequent checks
      const shouldContinue = trackConnectionError(instanceId);
      
      // Log connection failure
      await logConnectionFailure(instanceId, error);
      
      return "disconnected";
    } finally {
      setIsLoading(prev => ({ ...prev, [instanceId]: false }));
      // Release the lock after a longer delay to prevent immediate rechecking
      setTimeout(() => {
        instanceCheckInProgress.current[instanceId] = false;
      }, 2000); // 2 segundos de cooldown
    }
  };
  
  return {
    checkInstanceStatus,
    isLoading
  };
};

// Declare global window types
declare global {
  interface Window {
    _whatsAppInstancesState?: {
      instances: any[];
    };
    _whatsAppInstancesStore?: any;
  }
}
