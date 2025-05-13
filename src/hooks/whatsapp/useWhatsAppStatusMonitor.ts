
import { useState, useEffect, useRef } from "react";
import { WhatsAppInstance } from "./whatsappInstanceStore";
import { evolutionApiService } from "@/services/evolution-api";
import { supabase } from "@/integrations/supabase/client";
import { updateInstanceStatusAndPhone } from "./useWhatsAppDatabase";

/**
 * Hook for monitoring WhatsApp instance status with throttling
 */
export const useWhatsAppStatusMonitor = () => {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const instanceCheckInProgress = useRef<Record<string, boolean>>({});
  const lastCheckTime = useRef<Record<string, number>>({});
  
  // Check instance status with throttling and concurrency protection
  const checkInstanceStatus = async (instanceId: string, instanceName: string) => {
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
      if (!instanceName) return;
      
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
        } catch (error) {
          console.error("Error updating status in database:", error);
        }
        
        // If the instance is now connected, get the phone number
        if (status === 'connected') {
          try {
            // Here we would implement a method to get the phone number from the Evolution API
            // For now we'll just use a placeholder
            const phoneNumber = "Connected";
            
            // Update phone number in database
            const { error: phoneError } = await supabase
              .from('whatsapp_numbers')
              .update({ phone: phoneNumber })
              .eq('id', instanceId);
              
            if (phoneError) {
              console.error("Error updating phone number in database:", phoneError);
            }
          } catch (phoneError) {
            console.error("Error getting phone number:", phoneError);
          }
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
          checkInstanceStatus(instance.id, instance.instanceName);
        }, i * 1000); // Stagger by 1 second per instance
      }
      
      // Only periodically check connected instances to make sure they're still connected
      const connectedInstances = instances.filter(instance => instance.connected);
      for (let i = 0; i < connectedInstances.length; i++) {
        const instance = connectedInstances[i];
        // Check connected instances less frequently
        setTimeout(() => {
          checkInstanceStatus(instance.id, instance.instanceName);
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
