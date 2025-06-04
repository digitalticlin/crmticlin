
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

  // ETAPA 1: Força re-render imediato e síncrono
  const triggerForceUpdate = () => {
    console.log("🔄 FORCE UPDATE TRIGGERED");
    setForceUpdate(prev => {
      const newValue = prev + 1;
      console.log(`Force update: ${prev} -> ${newValue}`);
      return newValue;
    });
  };

  // ETAPA 1: Configuração síncrona com force update automático
  const setConfigWithUpdate = (newConfigOrUpdater: DashboardConfig | ((prev: DashboardConfig) => DashboardConfig)) => {
    console.log("📝 SET CONFIG WITH UPDATE");
    setConfig(currentConfig => {
      const newConfig = typeof newConfigOrUpdater === 'function' 
        ? newConfigOrUpdater(currentConfig) 
        : newConfigOrUpdater;
      
      console.log("Current config:", currentConfig);
      console.log("New config:", newConfig);
      
      // Força update imediato quando há mudança real
      const hasChanged = JSON.stringify(currentConfig) !== JSON.stringify(newConfig);
      if (hasChanged) {
        console.log("🚀 CONFIG CHANGED - TRIGGERING FORCE UPDATE");
        setTimeout(() => triggerForceUpdate(), 0);
      }
      
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
