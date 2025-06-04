
import { DashboardConfig } from "../types/dashboardConfigTypes";

export const mergeConfigUpdates = (
  currentConfig: DashboardConfig,
  updates: Partial<DashboardConfig>
): DashboardConfig => {
  return {
    kpis: { ...currentConfig.kpis, ...(updates.kpis || {}) },
    charts: { ...currentConfig.charts, ...(updates.charts || {}) },
    layout: { ...currentConfig.layout, ...(updates.layout || {}) },
    period_filter: updates.period_filter || currentConfig.period_filter
  };
};

export const validateConfig = (config: any): config is DashboardConfig => {
  return (
    config &&
    typeof config === 'object' &&
    config.kpis &&
    config.charts &&
    config.layout &&
    typeof config.period_filter === 'string'
  );
};
