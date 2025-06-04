
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

  // ETAPA 1: Função triggerForceUpdate simplificada e síncrona
  const triggerForceUpdate = () => {
    const timestamp = Date.now();
    console.log(`🔄 FORCE UPDATE TRIGGER [${timestamp}]`);
    
    setForceUpdate(prev => {
      const newValue = prev + 1;
      console.log(`📊 ForceUpdate: ${prev} -> ${newValue} [${timestamp}]`);
      return newValue;
    });
  };

  // ETAPA 1: setConfig simples SEM triggerForceUpdate interno
  const setConfigWithUpdate = (newConfigOrUpdater: DashboardConfig | ((prev: DashboardConfig) => DashboardConfig)) => {
    const timestamp = Date.now();
    console.log(`📝 CONFIG UPDATE [${timestamp}]`);
    
    setConfig(currentConfig => {
      const newConfig = typeof newConfigOrUpdater === 'function' 
        ? newConfigOrUpdater(currentConfig) 
        : newConfigOrUpdater;
      
      console.log(`📊 Config updated [${timestamp}]:`, {
        kpis: newConfig.kpis,
        charts: newConfig.charts
      });
      
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
    isInitializedRef
  };
};
