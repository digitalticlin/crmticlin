
import { useState, useRef } from "react";
import { evolutionApiService } from "@/services/evolution-api";
import { updateInstanceStatusAndPhone, updateConnectionAttempt, updateQrCodeInDatabase } from "../database";
import { useErrorTracker } from "./useErrorTracker";

/**
 * Hook for checking WhatsApp instance status with throttling
 */
export const useInstanceStatusChecker = () => {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const instanceCheckInProgress = useRef<Record<string, boolean>>({});
  const lastCheckTime = useRef<Record<string, number>>({});
  const { trackConnectionError, clearErrorTracking } = useErrorTracker();
  
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
      console.log(`Status check already in progress for instance ${instanceId}, skipping`);
      return;
    }
    
    // Throttle requests - but allow forced checks to bypass throttle
    const now = Date.now();
    const lastCheck = lastCheckTime.current[instanceId] || 0;
    const minInterval = 5000; // Default check interval
    
    if (!forceFresh && now - lastCheck < minInterval) {
      console.log(`Throttling status check for instance ${instanceId} - too soon`);
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
        try {
          const deviceInfo = await evolutionApiService.getDeviceInfo(instanceName);
          if (deviceInfo && deviceInfo.status === 'success') {
            // Update device info in store
            if (window._whatsAppInstancesStore) {
              const updateInstance = window._whatsAppInstancesStore.getState().actions.updateInstance;
              updateInstance(instanceId, { 
                connected: true,
                deviceInfo: {
                  batteryLevel: deviceInfo.device?.battery?.value || 0,
                  deviceModel: deviceInfo.device?.phone?.device_model || "Unknown device",
                  whatsappVersion: deviceInfo.device?.wa_version || "Unknown version",
                  lastConnectionTime: new Date().toISOString(),
                  platformType: deviceInfo.device?.platform || "Unknown platform"
                }
              });
            }
            
            // Clear error tracking since we connected successfully
            clearErrorTracking(instanceId);
          }
        } catch (error) {
          console.error("Error getting device information:", error);
          
          // Try a fallback to get at least the phone number
          try {
            // Use evolutionApiService instead of direct apiClient access
            const infoData = await evolutionApiService.checkInstanceStatus(instanceName);
            
            // Update phone in store
            if (window._whatsAppInstancesStore) {
              const updateInstance = window._whatsAppInstancesStore.getState().actions.updateInstance;
              updateInstance(instanceId, { 
                phoneNumber: undefined,
              });
            }
          } catch (fallbackError) {
            console.error("Error in fallback for info:", fallbackError);
          }
        }
      }
      
      // Update status in database
      if (instanceId !== "1") {
        try {
          await updateInstanceStatusAndPhone(instanceId, status);
          
          // Update global state
          if (window._whatsAppInstancesStore) {
            const updateInstance = window._whatsAppInstancesStore.getState().actions.updateInstance;
            updateInstance(instanceId, { connected: status === 'connected' });
          }
          
          // Register successful connection
          if (status === 'connected') {
            await updateConnectionAttempt(instanceId, true);
          }
          
        } catch (error) {
          console.error("Error updating status in database:", error);
          await updateConnectionAttempt(instanceId, false, error instanceof Error ? error.message : String(error));
        }
      }
      
      return status;
    } catch (error) {
      console.error(`Error checking status of instance ${instanceId}:`, error);
      
      // Track error and check if we should continue with frequent checks
      const shouldContinue = trackConnectionError(instanceId);
      
      await updateConnectionAttempt(instanceId, false, error instanceof Error ? error.message : String(error));
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
