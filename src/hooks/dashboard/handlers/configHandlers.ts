
import { useCallback, useLayoutEffect, useRef } from "react";
import { DashboardConfig, defaultConfig } from "../types/dashboardConfigTypes";
import { deepClone } from "../utils/configUtils";

export const createConfigHandlers = (
  config: DashboardConfig,
  setConfig: React.Dispatch<React.SetStateAction<DashboardConfig>>,
  triggerForceUpdate: () => void,
  scheduleSave: (config: DashboardConfig) => void,
  isInitializedRef: React.MutableRefObject<boolean>
) => {
  // ETAPA 1: Estado otimista melhorado para sincronização instantânea
  const optimisticStateRef = useRef<{
    kpis?: Partial<DashboardConfig['kpis']>;
    charts?: Partial<DashboardConfig['charts']>;
    lastUpdate?: number;
  }>({});

  // ETAPA 1: Função para aplicar estado otimista imediatamente
  const applyOptimisticUpdate = useCallback((type: 'kpis' | 'charts', key: string, value: boolean) => {
    const timestamp = Date.now();
    optimisticStateRef.current = {
      ...optimisticStateRef.current,
      [type]: {
        ...optimisticStateRef.current[type],
        [key]: value
      },
      lastUpdate: timestamp
    };
    
    console.log(`⚡ OPTIMISTIC APPLIED [${timestamp}]: ${type}.${key} = ${value}`);
    
    // ETAPA 1: Trigger imediato para re-render
    triggerForceUpdate();
  }, [triggerForceUpdate]);

  // ETAPA 1: Handler KPI com sincronização perfeita
  const handleKPIToggle = useCallback((kpiKey: keyof DashboardConfig['kpis']) => {
    if (!isInitializedRef.current) {
      console.log("❌ KPI Toggle blocked - not initialized");
      return;
    }
    
    const timestamp = Date.now();
    const newValue = !config.kpis[kpiKey];
    
    console.log(`🎯 KPI TOGGLE INSTANT [${timestamp}]: ${kpiKey} -> ${newValue}`);
    
    // ETAPA 1: Aplicar estado otimista ANTES do setState
    applyOptimisticUpdate('kpis', kpiKey, newValue);
    
    // ETAPA 1: Estado real atualizado em paralelo
    setConfig(currentConfig => {
      const newConfig = {
        ...currentConfig,
        kpis: {
          ...currentConfig.kpis,
          [kpiKey]: newValue
        }
      };
      
      console.log(`📊 CONFIG SYNCED [${timestamp}]:`, newConfig.kpis);
      scheduleSave(newConfig);
      
      return newConfig;
    });
    
    console.log(`✅ KPI TOGGLE COMPLETE [${timestamp}]: ${kpiKey}`);
  }, [config.kpis, setConfig, scheduleSave, applyOptimisticUpdate, isInitializedRef]);

  // ETAPA 1: Handler Chart com sincronização perfeita
  const handleChartToggle = useCallback((chartKey: keyof DashboardConfig['charts']) => {
    if (!isInitializedRef.current) {
      console.log("❌ Chart Toggle blocked - not initialized");
      return;
    }
    
    const timestamp = Date.now();
    const newValue = !config.charts[chartKey];
    
    console.log(`📈 CHART TOGGLE INSTANT [${timestamp}]: ${chartKey} -> ${newValue}`);
    
    // ETAPA 1: Aplicar estado otimista ANTES do setState
    applyOptimisticUpdate('charts', chartKey, newValue);
    
    // ETAPA 1: Estado real atualizado em paralelo
    setConfig(currentConfig => {
      const newConfig = {
        ...currentConfig,
        charts: {
          ...currentConfig.charts,
          [chartKey]: newValue
        }
      };
      
      console.log(`📊 CONFIG SYNCED [${timestamp}]:`, newConfig.charts);
      scheduleSave(newConfig);
      
      return newConfig;
    });
    
    console.log(`✅ CHART TOGGLE COMPLETE [${timestamp}]: ${chartKey}`);
  }, [config.charts, setConfig, scheduleSave, applyOptimisticUpdate, isInitializedRef]);

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
      triggerForceUpdate();
      return updatedConfig;
    });
  }, [setConfig, scheduleSave, triggerForceUpdate, isInitializedRef]);

  const resetToDefault = useCallback(() => {
    const timestamp = Date.now();
    console.log(`🔄 RESET TO DEFAULT [${timestamp}]`);
    const defaultConfigCopy = deepClone(defaultConfig);
    
    // Limpar estado otimista
    optimisticStateRef.current = {};
    
    setConfig(defaultConfigCopy);
    scheduleSave(defaultConfigCopy);
    triggerForceUpdate();
  }, [setConfig, scheduleSave, triggerForceUpdate]);

  // ETAPA 1: Função getCurrentState mais reativa
  const getCurrentState = useCallback(() => {
    const optimisticKpis = optimisticStateRef.current.kpis || {};
    const optimisticCharts = optimisticStateRef.current.charts || {};
    
    return {
      kpis: { ...config.kpis, ...optimisticKpis },
      charts: { ...config.charts, ...optimisticCharts },
      lastUpdate: optimisticStateRef.current.lastUpdate || 0
    };
  }, [config.kpis, config.charts]);

  return {
    handleKPIToggle,
    handleChartToggle,
    updateConfig,
    resetToDefault,
    getCurrentState
  };
};
