
import { useState, useRef } from "react";
import { WhatsAppInstance } from "./whatsappInstanceStore";
import { evolutionApiService } from "@/services/evolution-api";
import { updateInstanceStatusAndPhone } from "./database";

/**
 * Hook for monitoring WhatsApp instance status with throttling
 */
export const useWhatsAppStatusMonitor = () => {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const instanceCheckInProgress = useRef<Record<string, boolean>>({});
  const lastCheckTime = useRef<Record<string, number>>({});
  
  // Check instance status with throttling and concurrency protection
  const checkInstanceStatus = async (instanceId: string) => {
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
    
    // Throttle requests - only check if 5 seconds have passed since last check
    const now = Date.now();
    const lastCheck = lastCheckTime.current[instanceId] || 0;
    if (now - lastCheck < 5000) {
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
      
      // Update status in database
      if (instanceId !== "1") {
        try {
          await updateInstanceStatusAndPhone(instanceId, status);
          
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
      
      // Check instances that are not connected first
      const disconnectedInstances = instances.filter(instance => !instance.connected);
      
      // Stagger the checks to avoid hammering the API
      for (let i = 0; i < disconnectedInstances.length; i++) {
        const instance = disconnectedInstances[i];
        // Add a delay between each check to prevent API flooding
        setTimeout(() => {
          checkInstanceStatus(instance.id);
        }, i * 1000); // Stagger by 1 second per instance
      }
      
      // Only periodically check connected instances to make sure they're still connected
      const connectedInstances = instances.filter(instance => instance.connected);
      for (let i = 0; i < connectedInstances.length; i++) {
        const instance = connectedInstances[i];
        // Check connected instances less frequently
        setTimeout(() => {
          checkInstanceStatus(instance.id);
        }, (disconnectedInstances.length * 1000) + (i * 1000)); // Check after disconnected instances
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

  return {
    checkInstanceStatus,
    setupPeriodicStatusCheck,
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
