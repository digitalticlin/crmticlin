
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
  // CORREÇÃO: Handler KPI com propagação ÚNICA e imediata
  const handleKPIToggle = useCallback((kpiKey: keyof DashboardConfig['kpis']) => {
    if (!isInitializedRef.current) {
      console.log("❌ KPI Toggle blocked - not initialized");
      return;
    }
    
    const timestamp = Date.now();
    console.log(`🎯 KPI TOGGLE START [${timestamp}]: ${kpiKey}`);
    
    setConfig(currentConfig => {
      const newValue = !currentConfig.kpis[kpiKey];
      console.log(`${kpiKey}: ${currentConfig.kpis[kpiKey]} -> ${newValue} [${timestamp}]`);
      
      const newConfig = {
        ...currentConfig,
        kpis: {
          ...currentConfig.kpis,
          [kpiKey]: newValue
        }
      };
      
      console.log(`📊 NEW KPI CONFIG [${timestamp}]:`, newConfig.kpis);
      scheduleSave(newConfig);
      
      return newConfig;
    });
    
    console.log(`✅ KPI TOGGLE COMPLETE [${timestamp}]: ${kpiKey}`);
  }, [setConfig, scheduleSave, isInitializedRef]);

  // CORREÇÃO: Handler Chart com propagação ÚNICA e imediata
  const handleChartToggle = useCallback((chartKey: keyof DashboardConfig['charts']) => {
    if (!isInitializedRef.current) {
      console.log("❌ Chart Toggle blocked - not initialized");
      return;
    }
    
    const timestamp = Date.now();
    console.log(`📈 CHART TOGGLE START [${timestamp}]: ${chartKey}`);
    
    setConfig(currentConfig => {
      const newValue = !currentConfig.charts[chartKey];
      console.log(`${chartKey}: ${currentConfig.charts[chartKey]} -> ${newValue} [${timestamp}]`);
      
      const newConfig = {
        ...currentConfig,
        charts: {
          ...currentConfig.charts,
          [chartKey]: newValue
        }
      };
      
      console.log(`📊 NEW CHART CONFIG [${timestamp}]:`, newConfig.charts);
      scheduleSave(newConfig);
      
      return newConfig;
    });
    
    console.log(`✅ CHART TOGGLE COMPLETE [${timestamp}]: ${chartKey}`);
  }, [setConfig, scheduleSave, isInitializedRef]);

  const updateConfig = useCallback((newConfig: Partial<DashboardConfig>) => {
    if (!isInitializedRef.current) return;
    
    const timestamp = Date.now();
    console.log(`📝 UPDATE CONFIG [${timestamp}]:`, newConfig);
    
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
  }, [setConfig, scheduleSave, isInitializedRef]);

  const resetToDefault = useCallback(() => {
    const timestamp = Date.now();
    console.log(`🔄 RESET TO DEFAULT [${timestamp}]`);
    const defaultConfigCopy = deepClone(defaultConfig);
    
    setConfig(defaultConfigCopy);
    scheduleSave(defaultConfigCopy);
  }, [setConfig, scheduleSave]);

  return {
    handleKPIToggle,
    handleChartToggle,
    updateConfig,
    resetToDefault
  };
};
