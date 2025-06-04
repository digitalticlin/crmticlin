
import { useState, useRef } from "react";
import { DashboardConfig, defaultConfig } from "../types/dashboardConfigTypes";

export const useDashboardState = () => {
  const [config, setConfig] = useState<DashboardConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const isInitializedRef = useRef(false);

  // CORREÇÃO 1: Force update síncrono e imediato sem delay
  const triggerForceUpdate = () => {
    console.log("🔄 IMMEDIATE FORCE UPDATE TRIGGERED");
    setForceUpdate(prev => {
      const newValue = prev + 1;
      console.log(`Force update: ${prev} -> ${newValue}`);
      return newValue;
    });
  };

  // CORREÇÃO 2: setConfig direto sem setTimeout para propagação imediata
  const setConfigWithUpdate = (newConfigOrUpdater: DashboardConfig | ((prev: DashboardConfig) => DashboardConfig)) => {
    console.log("📝 DIRECT CONFIG UPDATE - NO DELAY");
    
    // Force update ANTES da mudança
    triggerForceUpdate();
    
    setConfig(currentConfig => {
      const newConfig = typeof newConfigOrUpdater === 'function' 
        ? newConfigOrUpdater(currentConfig) 
        : newConfigOrUpdater;
      
      console.log("Current config:", currentConfig);
      console.log("New config:", newConfig);
      
      return newConfig;
    });
    
    // Force update APÓS a mudança (sem setTimeout)
    triggerForceUpdate();
  };

  return {
    config,
    setConfig: setConfigWithUpdate,
    loading,
    setLoading,
    saving,
    setSaving,
    forceUpdate,
    triggerForceUpdate,
    saveTimeoutRef,
    isMountedRef,
    isInitializedRef
  };
};
