
import { DashboardConfig } from "../types/dashboardConfigTypes";

export const mergeConfigUpdates = (
  currentConfig: DashboardConfig,
  updates: Partial<DashboardConfig>
): DashboardConfig => {
  console.log("=== MERGE CONFIG UPDATES ===");
  console.log("Current config:", currentConfig);
  console.log("Updates:", updates);

  const mergedConfig: DashboardConfig = {
    kpis: {
      ...currentConfig.kpis,
      ...(updates.kpis || {})
    },
    charts: {
      ...currentConfig.charts,
      ...(updates.charts || {})
    },
    layout: {
      kpi_order: updates.layout?.kpi_order || currentConfig.layout.kpi_order,
      chart_order: updates.layout?.chart_order || currentConfig.layout.chart_order
    },
    period_filter: updates.period_filter !== undefined ? updates.period_filter : currentConfig.period_filter
  };

  console.log("Merged config:", mergedConfig);
  return mergedConfig;
};

export const validateConfig = (config: any): config is DashboardConfig => {
  if (!config || typeof config !== 'object') {
    console.error("Config validation failed: not an object");
    return false;
  }

  if (!config.kpis || typeof config.kpis !== 'object') {
    console.error("Config validation failed: invalid kpis");
    return false;
  }

  if (!config.charts || typeof config.charts !== 'object') {
    console.error("Config validation failed: invalid charts");
    return false;
  }

  if (!config.layout || typeof config.layout !== 'object') {
    console.error("Config validation failed: invalid layout");
    return false;
  }

  if (!Array.isArray(config.layout.kpi_order) || !Array.isArray(config.layout.chart_order)) {
    console.error("Config validation failed: invalid layout arrays");
    return false;
  }

  if (typeof config.period_filter !== 'string') {
    console.error("Config validation failed: invalid period_filter");
    return false;
  }

  return true;
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};
