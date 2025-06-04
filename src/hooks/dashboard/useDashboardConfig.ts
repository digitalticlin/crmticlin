
import { useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useDashboardState } from "./state/useDashboardState";
import { useConfigInitialization } from "./initialization/useConfigInitialization";
import { createConfigHandlers } from "./handlers/configHandlers";
import { configOperations } from "./operations/configOperations";

export { type DashboardConfig } from "./types/dashboardConfigTypes";

export const useDashboardConfig = () => {
  const { user } = useAuth();
  const { companyId } = useCompanyData();
  
  const {
    config,
    setConfig,
    loading,
    setLoading,
    saving,
    setSaving,
    forceUpdate,
    triggerForceUpdate,
    saveTimeoutRef,
    isMountedRef,
    isInitializedRef
  } = useDashboardState();

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [saveTimeoutRef]);

  // Create save scheduler
  const scheduleSave = useCallback((configToSave: any) => {
    if (!isMountedRef.current || !user?.id || !companyId) return;
    
    const saveScheduler = configOperations.createSaveScheduler(user.id, companyId, setSaving);
    saveScheduler(configToSave, saveTimeoutRef);
  }, [user?.id, companyId, setSaving, saveTimeoutRef, isMountedRef]);

  // Initialize config
  useConfigInitialization(
    user,
    companyId,
    setConfig,
    setLoading,
    triggerForceUpdate,
    isMountedRef,
    isInitializedRef
  );

  // Create handlers
  const handlers = createConfigHandlers(
    config,
    setConfig,
    triggerForceUpdate,
    scheduleSave,
    isInitializedRef
  );

  return {
    config,
    loading,
    saving,
    forceUpdate,
    ...handlers
  };
};
