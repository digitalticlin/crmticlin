
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
  const handleKPIToggle = useCallback((kpiKey: keyof DashboardConfig['kpis']) => {
    if (!isInitializedRef.current) return;
    
    console.log(`🎯 INSTANT KPI TOGGLE: ${kpiKey}`);
    
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
      
      scheduleSave(newConfig);
      return newConfig;
    });
    
    triggerForceUpdate();
  }, [setConfig, triggerForceUpdate, scheduleSave, isInitializedRef]);

  const handleChartToggle = useCallback((chartKey: keyof DashboardConfig['charts']) => {
    if (!isInitializedRef.current) return;
    
    console.log(`📈 INSTANT CHART TOGGLE: ${chartKey}`);
    
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
      
      scheduleSave(newConfig);
      return newConfig;
    });
    
    triggerForceUpdate();
  }, [setConfig, triggerForceUpdate, scheduleSave, isInitializedRef]);

  const updateConfig = useCallback((newConfig: Partial<DashboardConfig>) => {
    if (!isInitializedRef.current) return;
    
    console.log("📝 UPDATE CONFIG:", newConfig);
    
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
    setConfig(defaultConfigCopy);
    triggerForceUpdate();
    scheduleSave(defaultConfigCopy);
  }, [setConfig, triggerForceUpdate, scheduleSave]);

  return {
    handleKPIToggle,
    handleChartToggle,
    updateConfig,
    resetToDefault
  };
};
