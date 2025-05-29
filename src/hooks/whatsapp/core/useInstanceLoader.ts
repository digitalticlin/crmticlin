
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useWhatsAppFetcher } from '../useWhatsAppFetcher';
import { useInstanceLoadingState } from './useInstanceLoadingState';

interface UseInstanceLoaderProps {
  companyId: string | null;
  loadingState: ReturnType<typeof useInstanceLoadingState>;
}

export const useInstanceLoader = ({ companyId, loadingState }: UseInstanceLoaderProps) => {
  const { fetchInstances } = useWhatsAppFetcher();
  const {
    canFetch,
    markFetchStart,
    markFetchEnd,
    setGlobalLoading,
    updateLastError,
    isUnmountedRef
  } = loadingState;

  // Load WhatsApp instances when company ID is available, only once with aggressive throttling
  useEffect(() => {
    if (!companyId || !canFetch()) {
      console.log('[useInstanceLoader] Skipping fetch - conditions not met');
      return;
    }

    const loadInstances = async () => {
      try {
        console.log('[useInstanceLoader] Loading instances for company:', companyId);
        markFetchStart();
        setGlobalLoading(true);
        
        if (!isUnmountedRef.current) {
          await fetchInstances(companyId);
          console.log('[useInstanceLoader] Instances loaded successfully');
        }
      } catch (error) {
        if (!isUnmountedRef.current) {
          console.error("Error fetching WhatsApp instances:", error);
          updateLastError("Could not load WhatsApp instances");
          toast.error("Could not load WhatsApp instances");
        }
      } finally {
        if (!isUnmountedRef.current) {
          setGlobalLoading(false);
        }
        markFetchEnd();
      }
    };

    loadInstances();
  }, [companyId, fetchInstances]);

  return {
    // This hook only handles loading, no return needed
  };
};
