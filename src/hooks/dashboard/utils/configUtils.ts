
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
  // ✅ VALIDAÇÃO MAIS TOLERANTE com fallbacks
  if (!config || typeof config !== 'object') {
    console.error("Config validation failed: not an object");
    return false;
  }

  // ✅ VERIFICAR ESTRUTURA BÁSICA com fallbacks
  if (!config.kpis || typeof config.kpis !== 'object') {
    console.warn("Config validation: invalid kpis, using fallback");
    // Tentar usar fallback se possível
    if (config.layoutConfig && config.layoutConfig.kpis) {
      config.kpis = config.layoutConfig.kpis;
    } else {
      console.error("Config validation failed: no valid kpis found");
      return false;
    }
  }

  if (!config.charts || typeof config.charts !== 'object') {
    console.warn("Config validation: invalid charts, using fallback");
    // Tentar usar fallback se possível
    if (config.layoutConfig && config.layoutConfig.charts) {
      config.charts = config.layoutConfig.charts;
    } else {
      console.error("Config validation failed: no valid charts found");
      return false;
    }
  }

  if (!config.layout || typeof config.layout !== 'object') {
    console.warn("Config validation: invalid layout, using fallback");
    // Tentar usar fallback se possível
    if (config.layoutConfig && config.layoutConfig.layout) {
      config.layout = config.layoutConfig.layout;
    } else {
      console.error("Config validation failed: no valid layout found");
      return false;
    }
  }

  // ✅ VERIFICAR ARRAYS DE LAYOUT com fallbacks
  if (!Array.isArray(config.layout.kpi_order) || !Array.isArray(config.layout.chart_order)) {
    console.error("Config validation failed: invalid layout arrays");
    return false;
  }

  // ✅ VERIFICAR PERIOD_FILTER com fallback
  if (typeof config.period_filter !== 'string') {
    console.warn("Config validation: invalid period_filter, using fallback");
    // Tentar usar fallback se possível
    if (config.layoutConfig && config.layoutConfig.period_filter) {
      config.period_filter = config.layoutConfig.period_filter;
    } else {
      console.error("Config validation failed: no valid period_filter found");
      return false;
    }
  }

  return true;
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};
