
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
  // ETAPA 4: Estado otimista para atualização imediata
  const optimisticStateRef = useRef<{
    kpis?: Partial<DashboardConfig['kpis']>;
    charts?: Partial<DashboardConfig['charts']>;
  }>({});

  // ETAPA 2: Função para flush imediato do estado
  const flushStateAndUpdate = useCallback(() => {
    // Forçar flush do React batching
    setTimeout(() => {
      triggerForceUpdate();
    }, 0);
  }, [triggerForceUpdate]);

  // ETAPA 1: Handler KPI com sincronização perfeita
  const handleKPIToggle = useCallback((kpiKey: keyof DashboardConfig['kpis']) => {
    if (!isInitializedRef.current) {
      console.log("❌ KPI Toggle blocked - not initialized");
      return;
    }
    
    const timestamp = Date.now();
    console.log(`🎯 KPI TOGGLE START [${timestamp}]: ${kpiKey}`);
    
    // ETAPA 4: Atualização otimista imediata
    const newValue = !config.kpis[kpiKey];
    optimisticStateRef.current = {
      ...optimisticStateRef.current,
      kpis: {
        ...optimisticStateRef.current.kpis,
        [kpiKey]: newValue
      }
    };
    
    console.log(`⚡ OPTIMISTIC UPDATE [${timestamp}]: ${kpiKey} = ${newValue}`);
    
    // Atualização imediata do estado
    setConfig(currentConfig => {
      const newConfig = {
        ...currentConfig,
        kpis: {
          ...currentConfig.kpis,
          [kpiKey]: newValue
        }
      };
      
      console.log(`📊 CONFIG UPDATED [${timestamp}]:`, newConfig.kpis);
      scheduleSave(newConfig);
      
      // ETAPA 2: Flush imediato após setState
      flushStateAndUpdate();
      
      return newConfig;
    });
    
    console.log(`✅ KPI TOGGLE COMPLETE [${timestamp}]: ${kpiKey}`);
  }, [config.kpis, setConfig, scheduleSave, flushStateAndUpdate, isInitializedRef]);

  // ETAPA 1: Handler Chart com sincronização perfeita
  const handleChartToggle = useCallback((chartKey: keyof DashboardConfig['charts']) => {
    if (!isInitializedRef.current) {
      console.log("❌ Chart Toggle blocked - not initialized");
      return;
    }
    
    const timestamp = Date.now();
    console.log(`📈 CHART TOGGLE START [${timestamp}]: ${chartKey}`);
    
    // ETAPA 4: Atualização otimista imediata
    const newValue = !config.charts[chartKey];
    optimisticStateRef.current = {
      ...optimisticStateRef.current,
      charts: {
        ...optimisticStateRef.current.charts,
        [chartKey]: newValue
      }
    };
    
    console.log(`⚡ OPTIMISTIC UPDATE [${timestamp}]: ${chartKey} = ${newValue}`);
    
    // Atualização imediata do estado
    setConfig(currentConfig => {
      const newConfig = {
        ...currentConfig,
        charts: {
          ...currentConfig.charts,
          [chartKey]: newValue
        }
      };
      
      console.log(`📊 CONFIG UPDATED [${timestamp}]:`, newConfig.charts);
      scheduleSave(newConfig);
      
      // ETAPA 2: Flush imediato após setState
      flushStateAndUpdate();
      
      return newConfig;
    });
    
    console.log(`✅ CHART TOGGLE COMPLETE [${timestamp}]: ${chartKey}`);
  }, [config.charts, setConfig, scheduleSave, flushStateAndUpdate, isInitializedRef]);

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
      flushStateAndUpdate();
      return updatedConfig;
    });
  }, [setConfig, scheduleSave, flushStateAndUpdate, isInitializedRef]);

  const resetToDefault = useCallback(() => {
    const timestamp = Date.now();
    console.log(`🔄 RESET TO DEFAULT [${timestamp}]`);
    const defaultConfigCopy = deepClone(defaultConfig);
    
    // Limpar estado otimista
    optimisticStateRef.current = {};
    
    setConfig(defaultConfigCopy);
    scheduleSave(defaultConfigCopy);
    flushStateAndUpdate();
  }, [setConfig, scheduleSave, flushStateAndUpdate]);

  // ETAPA 4: Função para obter estado atual (otimista + real)
  const getCurrentState = useCallback(() => {
    return {
      kpis: { ...config.kpis, ...optimisticStateRef.current.kpis },
      charts: { ...config.charts, ...optimisticStateRef.current.charts }
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
