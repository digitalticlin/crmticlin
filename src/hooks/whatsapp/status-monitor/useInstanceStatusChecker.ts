import { useState, useRef } from "react";
import { evolutionApiService } from "@/services/evolution-api";
import { useErrorTracker } from "./useErrorTracker";
import { useDeviceInfoFetcher } from "./useDeviceInfoFetcher";
import { useStatusUpdater } from "./useStatusUpdater";

/**
 * Hook for checking WhatsApp instance status with throttling
 */
export const useInstanceStatusChecker = () => {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const instanceCheckInProgress = useRef<Record<string, boolean>>({});
  const lastCheckTime = useRef<Record<string, number>>({});
  
  const { trackConnectionError, clearErrorTracking } = useErrorTracker();
  const { fetchDeviceInfo, fetchPhoneNumber } = useDeviceInfoFetcher();
  const { updateInstanceStatus, logConnectionFailure } = useStatusUpdater();
  
  // Check instance status with throttling and concurrency protection
  const checkInstanceStatus = async (instanceId: string, forceFresh: boolean = false) => {
    // Find instance by ID
    const instance = window._whatsAppInstancesState?.instances?.find(i => i.id === instanceId);
    if (!instance || !instance.instanceName) {
      console.error(`Instance not found for ID: ${instanceId}`);
      return "unknown";
    }
    
    const instanceName = instance.instanceName;
    
    // Prevent concurrent checks for the same instance
    if (instanceCheckInProgress.current[instanceId]) {
      console.log(`Status check já em andamento para ${instanceId}, ignorando`);
      return;
    }
    // Throttle: máximo 1x a cada 5 segundos 
    const now = Date.now();
    const lastCheck = lastCheckTime.current[instanceId] || 0;
    const minInterval = 5000; // 5s Default para todos
    if (!forceFresh && now - lastCheck < minInterval) {
      console.log(`Throttling status check para ${instanceId} < 5s`);
      return;
    }
    
    try {
      console.log(`Checking status of instance: ${instanceName}`);
      
      // Mark this instance as being checked
      instanceCheckInProgress.current[instanceId] = true;
      lastCheckTime.current[instanceId] = now;
      setIsLoading(prev => ({ ...prev, [instanceId]: true }));
      
      // Get current instance status via Evolution API
      const status = await evolutionApiService.checkInstanceStatus(instanceName);
      console.log(`Status of instance ${instanceName}: ${status}`);
      
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
      console.error(`Error checking status of instance ${instanceId}:`, error);
      
      // Try fallback for phone number if available
      try {
        await fetchPhoneNumber(instanceId, instanceName);
      } catch (fallbackError) {
        console.error("Fallback phone fetch failed:", fallbackError);
      }
      
      // Track error and check if we should continue with frequent checks
      const shouldContinue = trackConnectionError(instanceId);
      
      // Log connection failure
      await logConnectionFailure(instanceId, error);
      
      return "disconnected";
    } finally {
      setIsLoading(prev => ({ ...prev, [instanceId]: false }));
      // Release the lock after a short delay to prevent immediate rechecking
      setTimeout(() => {
        instanceCheckInProgress.current[instanceId] = false;
      }, 500);
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
