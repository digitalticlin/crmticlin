
import { useState, useRef } from "react";
import { WhatsAppInstance } from "./whatsappInstanceStore";
import { evolutionApiService } from "@/services/evolution-api";
import { updateInstanceStatusAndPhone, updateQrCodeInDatabase } from "./database";

/**
 * Hook for monitoring WhatsApp instance status with throttling and priority checking
 */
export const useWhatsAppStatusMonitor = () => {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const instanceCheckInProgress = useRef<Record<string, boolean>>({});
  const lastCheckTime = useRef<Record<string, number>>({});
  const connectingInstances = useRef<Set<string>>(new Set());
  
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
    const minInterval = connectingInstances.current.has(instanceId) ? 2000 : 5000; // More frequent checks for connecting instances
    
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
          }
        } catch (error) {
          console.error("Error getting device information:", error);
        }
      }
      
      // Update status in database
      if (instanceId !== "1") {
        try {
          await updateInstanceStatusAndPhone(instanceId, status);
          
          // If the instance was in connecting state and is now connected, remove from connecting set
          if (status === 'connected' && connectingInstances.current.has(instanceId)) {
            console.log(`Instance ${instanceName} is now connected, removing from connecting instances`);
            connectingInstances.current.delete(instanceId);
          }
          
          // Update global state (this is handled by store updates in our new architecture)
          if (window._whatsAppInstancesStore) {
            const updateInstance = window._whatsAppInstancesStore.getState().actions.updateInstance;
            updateInstance(instanceId, { connected: status === 'connected' });
          }
          
        } catch (error) {
          console.error("Error updating status in database:", error);
        }
      }
      
      return status;
    } catch (error) {
      console.error(`Error checking status of instance ${instanceId}:`, error);
      return "disconnected";
    } finally {
      setIsLoading(prev => ({ ...prev, [instanceId]: false }));
      // Release the lock after a short delay to prevent immediate rechecking
      setTimeout(() => {
        instanceCheckInProgress.current[instanceId] = false;
      }, 500);
    }
  };

  // Set up periodic status checks for multiple instances
  const setupPeriodicStatusCheck = (
    instances: WhatsAppInstance[], 
    checkInterval: number = 15000
  ) => {
    if (!instances.length) return null;
    
    // Add to window for access by other components
    if (!window._whatsAppInstancesState) {
      window._whatsAppInstancesState = { instances };
    } else {
      window._whatsAppInstancesState.instances = instances;
    }
    
    console.log("Starting periodic status check for", instances.length, "instances");
    
    // First immediate check with staggered timing to prevent API flooding
    const checkAllInstances = async () => {
      console.log("Checking status of all instances...");
      
      // First, check instances that are connecting (higher priority)
      const connectingInstanceIds = Array.from(connectingInstances.current);
      console.log(`${connectingInstanceIds.length} instances are in connecting state with higher priority checking`);
      
      for (let i = 0; i < connectingInstanceIds.length; i++) {
        const instanceId = connectingInstanceIds[i];
        // Add a slight delay between each check to prevent API flooding
        setTimeout(() => {
          // Force fresh checks for connecting instances
          checkInstanceStatus(instanceId, true);
        }, i * 500); 
      }
      
      // Then check disconnected instances (medium priority)
      const disconnectedInstances = instances.filter(
        instance => !instance.connected && !connectingInstances.current.has(instance.id)
      );
      
      // Stagger the checks to avoid hammering the API
      for (let i = 0; i < disconnectedInstances.length; i++) {
        const instance = disconnectedInstances[i];
        // Add a delay between each check to prevent API flooding
        setTimeout(() => {
          checkInstanceStatus(instance.id);
        }, (connectingInstanceIds.length * 500) + (i * 1000)); // Stagger after connecting instances
      }
      
      // Finally check connected instances (lowest priority)
      const connectedInstances = instances.filter(instance => instance.connected);
      for (let i = 0; i < connectedInstances.length; i++) {
        const instance = connectedInstances[i];
        // Check connected instances less frequently
        setTimeout(() => {
          checkInstanceStatus(instance.id);
        }, (connectingInstanceIds.length * 500) + (disconnectedInstances.length * 1000) + (i * 1000));
      }
    };
    
    // Run the first check immediately
    checkAllInstances();
    
    // Set up periodic check
    const intervalId = setInterval(checkAllInstances, checkInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  };

  // Add an instance to the priority-checking list
  const addConnectingInstance = (instanceId: string) => {
    console.log(`Adding instance ${instanceId} to connecting instances for priority checking`);
    connectingInstances.current.add(instanceId);
    // Immediately check status
    checkInstanceStatus(instanceId, true);
  };

  return {
    checkInstanceStatus,
    setupPeriodicStatusCheck,
    addConnectingInstance,
    isLoading
  };
};

// Declare global window types
declare global {
  interface Window {
    _whatsAppInstancesState?: {
      instances: WhatsAppInstance[];
    };
    _whatsAppInstancesStore?: any;
  }
}
