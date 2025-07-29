
import { DashboardConfig } from "../types/dashboardConfigTypes";

export const createConfigHandlers = (
  config: DashboardConfig,
  setConfig: (newConfig: DashboardConfig | ((prev: DashboardConfig) => DashboardConfig)) => void,
  triggerForceUpdate: () => void,
  scheduleSave: (config: DashboardConfig) => void,
  isInitializedRef: React.MutableRefObject<boolean>
) => {
  const updateKPIVisibility = (kpiKey: string, visible: boolean) => {
    if (!isInitializedRef.current) return;
    
    setConfig(prev => ({
      ...prev,
      kpis: {
        ...prev.kpis,
        [kpiKey]: visible
      }
    }));
    
    triggerForceUpdate();
    scheduleSave(config);
  };

  const updateChartVisibility = (chartKey: string, visible: boolean) => {
    if (!isInitializedRef.current) return;
    
    setConfig(prev => ({
      ...prev,
      charts: {
        ...prev.charts,
        [chartKey]: visible
      }
    }));
    
    triggerForceUpdate();
    scheduleSave(config);
  };

  const updatePeriodFilter = (period: string) => {
    if (!isInitializedRef.current) return;
    
    setConfig(prev => ({
      ...prev,
      period_filter: period
    }));
    
    triggerForceUpdate();
    scheduleSave(config);
  };

  const resetToDefault = () => {
    if (!isInitializedRef.current) return;
    
    const defaultConfig = require("../types/dashboardConfigTypes").defaultConfig;
    setConfig(defaultConfig);
    triggerForceUpdate();
    scheduleSave(defaultConfig);
  };

  return {
    updateKPIVisibility,
    updateChartVisibility,
    updatePeriodFilter,
    resetToDefault
  };
};
