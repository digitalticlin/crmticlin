
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

  // CORREÇÃO ETAPA 1: Trigger imediato sem setTimeout
  const triggerForceUpdate = () => {
    renderCountRef.current += 1;
    const timestamp = Date.now();
    console.log(`🔄 IMMEDIATE FORCE UPDATE [${timestamp}] - Render Count: ${renderCountRef.current}`);
    
    setForceUpdate(prev => {
      const newValue = prev + 1;
      console.log(`📊 Force update: ${prev} -> ${newValue} [${timestamp}]`);
      return newValue;
    });
  };

  // CORREÇÃO ETAPA 1: Remover setTimeout, execução imediata
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
      
      // CORREÇÃO: Force update IMEDIATO após setState
      triggerForceUpdate();
      console.log(`✅ CONFIG UPDATE COMPLETE [${timestamp}]`);
      
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
