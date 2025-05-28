
import { useRef, useEffect } from "react";
import { WhatsAppConnectionStatus } from "../database/whatsappDatabaseTypes";

/**
 * Hook for setting up periodic status checks for WhatsApp instances
 */
export const usePeriodicChecker = () => {
  const checkInterval = useRef<NodeJS.Timeout | null>(null);
  const connectingInstances = useRef<Set<string>>(new Set());
  
  /**
   * Setup periodic status checking for instances
   */
  const setupPeriodicStatusCheck = (
    instances: Array<{ id: string; instanceName: string; connection_status?: string }>,
    checkFunction: (instanceId: string, instanceName: string) => Promise<WhatsAppConnectionStatus>
  ) => {
    // Clear existing interval
    if (checkInterval.current) {
      clearInterval(checkInterval.current);
    }
    
    // Only check instances that are not already connected - use "open" instead of "connected"
    const instancesToCheck = instances.filter(instance => 
      instance.connection_status !== "open" && 
      instance.connection_status !== "closed"
    );
    
    if (instancesToCheck.length === 0) {
      console.log("No instances need periodic checking");
      return;
    }
    
    console.log(`Setting up periodic status check for ${instancesToCheck.length} instances`);
    
    checkInterval.current = setInterval(async () => {
      for (const instance of instancesToCheck) {
        try {
          const status = await checkFunction(instance.id, instance.instanceName);
          
          // If instance becomes connected, we can remove it from periodic checking - use "open" instead of "connected"
          if (status === "open") {
            console.log(`Instance ${instance.instanceName} is now connected, removing from periodic checks`);
            connectingInstances.current.delete(instance.id);
          }
        } catch (error) {
          console.error(`Error checking status for instance ${instance.instanceName}:`, error);
        }
      }
    }, 10000); // Check every 10 seconds
  };
  
  /**
   * Stop periodic checking
   */
  const stopPeriodicStatusCheck = () => {
    if (checkInterval.current) {
      clearInterval(checkInterval.current);
      checkInterval.current = null;
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPeriodicStatusCheck();
    };
  }, []);
  
  return {
    setupPeriodicStatusCheck,
    stopPeriodicStatusCheck
  };
};
