
import { useState, useRef } from 'react';

export const useInstanceLoadingState = () => {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [lastError, setLastError] = useState<string | null>(null);
  
  // Refs para controlar execuções
  const loadingRef = useRef(false);
  const lastFetchRef = useRef<number>(0);
  const isUnmountedRef = useRef(false);

  const setInstanceLoading = (instanceId: string, loading: boolean) => {
    if (!isUnmountedRef.current) {
      setIsLoading(prev => ({ ...prev, [instanceId]: loading }));
    }
  };

  const setGlobalLoading = (loading: boolean) => {
    if (!isUnmountedRef.current) {
      setIsLoading(prev => ({ ...prev, fetch: loading }));
    }
  };

  const updateLastError = (error: string | null) => {
    if (!isUnmountedRef.current) {
      setLastError(error);
    }
  };

  const canFetch = (minInterval: number = 60000): boolean => {
    const now = Date.now();
    return !loadingRef.current && 
           !isUnmountedRef.current && 
           (now - lastFetchRef.current > minInterval);
  };

  const markFetchStart = () => {
    loadingRef.current = true;
    lastFetchRef.current = Date.now();
  };

  const markFetchEnd = () => {
    loadingRef.current = false;
  };

  const markUnmounted = () => {
    isUnmountedRef.current = true;
  };

  const resetUnmounted = () => {
    isUnmountedRef.current = false;
  };

  return {
    isLoading,
    lastError,
    setInstanceLoading,
    setGlobalLoading,
    updateLastError,
    canFetch,
    markFetchStart,
    markFetchEnd,
    markUnmounted,
    resetUnmounted,
    isUnmountedRef
  };
};
