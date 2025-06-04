
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
  // ETAPA 2: Handler KPI com propagação imediata e síncrona
  const handleKPIToggle = useCallback((kpiKey: keyof DashboardConfig['kpis']) => {
    if (!isInitializedRef.current) {
      console.log("❌ KPI Toggle blocked - not initialized");
      return;
    }
    
    console.log(`🎯 INSTANT KPI TOGGLE START: ${kpiKey}`);
    
    // Força update ANTES da mudança para garantir sincronia
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
      
      // Schedule save após mudança
      scheduleSave(newConfig);
      
      // Força update adicional APÓS mudança
      setTimeout(() => {
        console.log("🚀 POST-KPI FORCE UPDATE");
        triggerForceUpdate();
      }, 0);
      
      return newConfig;
    });
    
    console.log(`✅ KPI TOGGLE COMPLETE: ${kpiKey}`);
  }, [setConfig, triggerForceUpdate, scheduleSave, isInitializedRef]);

  // ETAPA 2: Handler Chart com propagação imediata e síncrona
  const handleChartToggle = useCallback((chartKey: keyof DashboardConfig['charts']) => {
    if (!isInitializedRef.current) {
      console.log("❌ Chart Toggle blocked - not initialized");
      return;
    }
    
    console.log(`📈 INSTANT CHART TOGGLE START: ${chartKey}`);
    
    // Força update ANTES da mudança para garantir sincronia
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
      
      // Schedule save após mudança
      scheduleSave(newConfig);
      
      // Força update adicional APÓS mudança
      setTimeout(() => {
        console.log("🚀 POST-CHART FORCE UPDATE");
        triggerForceUpdate();
      }, 0);
      
      return newConfig;
    });
    
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
      setTimeout(() => triggerForceUpdate(), 0);
      return updatedConfig;
    });
  }, [setConfig, triggerForceUpdate, scheduleSave, isInitializedRef]);

  const resetToDefault = useCallback(() => {
    console.log("🔄 RESET TO DEFAULT");
    const defaultConfigCopy = deepClone(defaultConfig);
    
    triggerForceUpdate();
    setConfig(defaultConfigCopy);
    scheduleSave(defaultConfigCopy);
    setTimeout(() => triggerForceUpdate(), 0);
  }, [setConfig, triggerForceUpdate, scheduleSave]);

  return {
    handleKPIToggle,
    handleChartToggle,
    updateConfig,
    resetToDefault
  };
};
