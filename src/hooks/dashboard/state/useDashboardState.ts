
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
  const renderCountRef = useRef(0);

  // CORREÇÃO DEFINITIVA: Single force update sem race condition
  const triggerForceUpdate = () => {
    renderCountRef.current += 1;
    const timestamp = Date.now();
    console.log(`🔄 FORCE UPDATE TRIGGERED [${timestamp}] - Render Count: ${renderCountRef.current}`);
    
    setForceUpdate(prev => {
      const newValue = prev + 1;
      console.log(`📊 Force update: ${prev} -> ${newValue} [${timestamp}]`);
      return newValue;
    });
  };

  // CORREÇÃO: setConfig com propagação garantida e single force update
  const setConfigWithUpdate = (newConfigOrUpdater: DashboardConfig | ((prev: DashboardConfig) => DashboardConfig)) => {
    const timestamp = Date.now();
    console.log(`📝 CONFIG UPDATE START [${timestamp}]`);
    
    setConfig(currentConfig => {
      const newConfig = typeof newConfigOrUpdater === 'function' 
        ? newConfigOrUpdater(currentConfig) 
        : newConfigOrUpdater;
      
      console.log(`📊 Config changed [${timestamp}]:`, {
        kpis: newConfig.kpis,
        charts: newConfig.charts,
        renderCount: renderCountRef.current
      });
      
      // Force update APÓS mudança do estado (pequeno delay para garantir que React processe)
      setTimeout(() => {
        triggerForceUpdate();
        console.log(`✅ CONFIG UPDATE COMPLETE [${timestamp}]`);
      }, 10);
      
      return newConfig;
    });
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
    isInitializedRef,
    renderCount: renderCountRef.current
  };
};
