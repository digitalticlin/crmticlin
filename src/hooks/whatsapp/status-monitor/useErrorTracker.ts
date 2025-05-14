
import { useRef } from "react";

/**
 * Hook for tracking connection errors and determining check frequency
 */
export const useErrorTracker = () => {
  const lastConnectionError = useRef<Record<string, { timestamp: number, count: number }>>({});
  
  // Track connection errors and decide whether to continue with frequent checks
  const trackConnectionError = (instanceId: string): boolean => {
    const now = Date.now();
    const errorState = lastConnectionError.current[instanceId] || { timestamp: 0, count: 0 };
    
    // If the last error was more than 5 minutes ago, reset the counter
    if (now - errorState.timestamp > 5 * 60 * 1000) {
      lastConnectionError.current[instanceId] = { timestamp: now, count: 1 };
      return true; // Continue checks
    }
    
    // Increment error counter
    const newCount = errorState.count + 1;
    lastConnectionError.current[instanceId] = { timestamp: now, count: newCount };
    
    // If we've had too many consecutive errors in a short period, reduce check frequency
    if (newCount > 5) {
      console.log(`Many consecutive errors for instance ${instanceId}, reducing check frequency`);
      return false; // Stop frequent checks
    }
    
    return true;
  };
  
  // Clear error records for an instance when it connects successfully
  const clearErrorTracking = (instanceId: string) => {
    if (lastConnectionError.current[instanceId]) {
      delete lastConnectionError.current[instanceId];
    }
  };
  
  return {
    trackConnectionError,
    clearErrorTracking
  };
};
