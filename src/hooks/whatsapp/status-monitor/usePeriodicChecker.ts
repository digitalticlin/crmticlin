
import { WhatsAppInstance } from "../whatsappInstanceStore";
import { usePriorityMonitor } from "./usePriorityMonitor";
import { useInstanceStatusChecker } from "./useInstanceStatusChecker";

/**
 * Hook for setting up periodic status checks with priority handling
 */
export const usePeriodicChecker = () => {
  const { getConnectingInstances, isConnectingInstance, removeConnectingInstance } = usePriorityMonitor();
  const { checkInstanceStatus, isLoading } = useInstanceStatusChecker();
  
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
    
    // Check all instances with priority ordering
    const checkAllInstances = async () => {
      console.log("Checking status of all instances...");
      
      // First, check instances that are connecting (higher priority)
      const connectingInstanceIds = getConnectingInstances();
      console.log(`${connectingInstanceIds.length} instances are in connecting state with higher priority checking`);
      
      for (let i = 0; i < connectingInstanceIds.length; i++) {
        const instanceId = connectingInstanceIds[i];
        // Add a slight delay between each check to prevent API flooding
        setTimeout(() => {
          // Force fresh checks for connecting instances
          checkInstanceStatus(instanceId, true).then(status => {
            // If the instance was in connecting state and is now connected, remove from connecting set
            if (status === 'connected' && isConnectingInstance(instanceId)) {
              console.log(`Instance ${instanceId} is now connected, removing from connecting instances`);
              removeConnectingInstance(instanceId);
            }
          });
        }, i * 500); 
      }
      
      // Then check disconnected instances (medium priority)
      const disconnectedInstances = instances.filter(
        instance => !instance.connected && !isConnectingInstance(instance.id)
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
  
  return {
    setupPeriodicStatusCheck,
    isLoading
  };
};
