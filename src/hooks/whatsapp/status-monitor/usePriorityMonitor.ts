
import { useRef } from "react";

/**
 * Hook for managing priority checking of connecting instances
 */
export const usePriorityMonitor = () => {
  const connectingInstances = useRef<Set<string>>(new Set());
  
  // Add an instance to the priority-checking list
  const addConnectingInstance = (instanceId: string) => {
    console.log(`Adding instance ${instanceId} to connecting instances for priority checking`);
    connectingInstances.current.add(instanceId);
  };
  
  // Remove an instance from the priority-checking list
  const removeConnectingInstance = (instanceId: string) => {
    console.log(`Removing instance ${instanceId} from connecting instances`);
    connectingInstances.current.delete(instanceId);
  };
  
  // Check if an instance is in the connecting state
  const isConnectingInstance = (instanceId: string): boolean => {
    return connectingInstances.current.has(instanceId);
  };
  
  // Get all connecting instances
  const getConnectingInstances = (): string[] => {
    return Array.from(connectingInstances.current);
  };
  
  return {
    addConnectingInstance,
    removeConnectingInstance,
    isConnectingInstance,
    getConnectingInstances
  };
};
