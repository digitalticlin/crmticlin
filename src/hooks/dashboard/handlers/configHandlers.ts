
import { useCallback } from "react";
import { DashboardConfig, defaultConfig } from "../types/dashboardConfigTypes";
import { deepClone } from "../utils/configUtils";

export const createConfigHandlers = (
  config: DashboardConfig,
  setConfig: React.Dispatch<React.SetStateAction<DashboardConfig>>,
  triggerForceUpdate: () => void,
  scheduleSave: (config: DashboardConfig) => void,
  isInitializedRef: React.MutableRefObject<boolean>
) => {
  // CORREÇÃO 3: Handler KPI com propagação IMEDIATA sem setTimeout
  const handleKPIToggle = useCallback((kpiKey: keyof DashboardConfig['kpis']) => {
    if (!isInitializedRef.current) {
      console.log("❌ KPI Toggle blocked - not initialized");
      return;
    }
    
    console.log(`🎯 IMMEDIATE KPI TOGGLE: ${kpiKey}`);
    
    // Force update ANTES da mudança
    triggerForceUpdate();
    
    setConfig(currentConfig => {
      const newValue = !currentConfig.kpis[kpiKey];
      console.log(`${kpiKey}: ${currentConfig.kpis[kpiKey]} -> ${newValue}`);
      
      const newConfig = {
        ...currentConfig,
        kpis: {
          ...currentConfig.kpis,
          [kpiKey]: newValue
        }
      };
      
      console.log("🔄 NEW KPI CONFIG:", newConfig.kpis);
      scheduleSave(newConfig);
      
      return newConfig;
    });
    
    // Force update APÓS mudança (imediato)
    triggerForceUpdate();
    
    console.log(`✅ KPI TOGGLE COMPLETE: ${kpiKey}`);
  }, [setConfig, triggerForceUpdate, scheduleSave, isInitializedRef]);

  // CORREÇÃO 4: Handler Chart com propagação IMEDIATA sem setTimeout
  const handleChartToggle = useCallback((chartKey: keyof DashboardConfig['charts']) => {
    if (!isInitializedRef.current) {
      console.log("❌ Chart Toggle blocked - not initialized");
      return;
    }
    
    console.log(`📈 IMMEDIATE CHART TOGGLE: ${chartKey}`);
    
    // Force update ANTES da mudança
    triggerForceUpdate();
    
    setConfig(currentConfig => {
      const newValue = !currentConfig.charts[chartKey];
      console.log(`${chartKey}: ${currentConfig.charts[chartKey]} -> ${newValue}`);
      
      const newConfig = {
        ...currentConfig,
        charts: {
          ...currentConfig.charts,
          [chartKey]: newValue
        }
      };
      
      console.log("🔄 NEW CHART CONFIG:", newConfig.charts);
      scheduleSave(newConfig);
      
      return newConfig;
    });
    
    // Force update APÓS mudança (imediato)
    triggerForceUpdate();
    
    console.log(`✅ CHART TOGGLE COMPLETE: ${chartKey}`);
  }, [setConfig, triggerForceUpdate, scheduleSave, isInitializedRef]);

  const updateConfig = useCallback((newConfig: Partial<DashboardConfig>) => {
    if (!isInitializedRef.current) return;
    
    console.log("📝 UPDATE CONFIG:", newConfig);
    
    triggerForceUpdate();
    
    setConfig(currentConfig => {
      const updatedConfig = {
        ...currentConfig,
        ...newConfig,
        kpis: { ...currentConfig.kpis, ...(newConfig.kpis || {}) },
        charts: { ...currentConfig.charts, ...(newConfig.charts || {}) },
        layout: { ...currentConfig.layout, ...(newConfig.layout || {}) }
      };
      
      scheduleSave(updatedConfig);
      return updatedConfig;
    });
    
    triggerForceUpdate();
  }, [setConfig, triggerForceUpdate, scheduleSave, isInitializedRef]);

  const resetToDefault = useCallback(() => {
    console.log("🔄 RESET TO DEFAULT");
    const defaultConfigCopy = deepClone(defaultConfig);
    
    triggerForceUpdate();
    setConfig(defaultConfigCopy);
    scheduleSave(defaultConfigCopy);
    triggerForceUpdate();
  }, [setConfig, triggerForceUpdate, scheduleSave]);

  return {
    handleKPIToggle,
    handleChartToggle,
    updateConfig,
    resetToDefault
  };
};
