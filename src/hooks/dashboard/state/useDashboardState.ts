
import { useState, useRef } from "react";
import { DashboardConfig, defaultConfig } from "../types/dashboardConfigTypes";

export const useDashboardState = () => {
  const [config, setConfig] = useState<DashboardConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const isInitializedRef = useRef(false);
  
  // ✅ ANTI-LOOP: Controle de execução melhorado
  const lastUpdateRef = useRef<number>(0);
  const updateCountRef = useRef<number>(0);
  const lastConfigRef = useRef<string>('');

  // ✅ ETAPA 1: Função triggerForceUpdate com proteção anti-loop otimizada
  const triggerForceUpdate = () => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    
    // ✅ PROTEÇÃO: Evitar atualizações muito frequentes (aumentado para 200ms)
    if (timeSinceLastUpdate < 200) {
      updateCountRef.current++;
      if (updateCountRef.current > 3) {
        console.warn(`🚨 ANTI-LOOP: Muitas atualizações em pouco tempo (${updateCountRef.current})`);
        return;
      }
    } else {
      updateCountRef.current = 0;
    }
    
    lastUpdateRef.current = now;
    
    console.log(`🔄 FORCE UPDATE TRIGGER [${now}]`);
    
    setForceUpdate(prev => {
      const newValue = prev + 1;
      console.log(`📊 ForceUpdate: ${prev} -> ${newValue} [${now}]`);
      return newValue;
    });
  };

  // ✅ ETAPA 1: setConfig com proteção anti-loop melhorada
  const setConfigWithUpdate = (newConfigOrUpdater: DashboardConfig | ((prev: DashboardConfig) => DashboardConfig)) => {
    const timestamp = Date.now();
    console.log(`📝 CONFIG UPDATE [${timestamp}]`);
    
    setConfig(currentConfig => {
      const newConfig = typeof newConfigOrUpdater === 'function' 
        ? newConfigOrUpdater(currentConfig) 
        : newConfigOrUpdater;
      
      // ✅ VERIFICAR SE REALMENTE MUDOU (comparação mais rigorosa)
      const currentConfigStr = JSON.stringify(currentConfig);
      const newConfigStr = JSON.stringify(newConfig);
      
      if (currentConfigStr === newConfigStr) {
        console.log(`⚠️ CONFIG UNCHANGED [${timestamp}] - ignorando atualização`);
        return currentConfig;
      }
      
      // ✅ VERIFICAR SE É A MESMA CONFIGURAÇÃO DA ÚLTIMA ATUALIZAÇÃO
      if (newConfigStr === lastConfigRef.current) {
        console.log(`⚠️ CONFIG DUPLICATE [${timestamp}] - ignorando duplicata`);
        return currentConfig;
      }
      
      lastConfigRef.current = newConfigStr;
      
      console.log(`📊 Config updated [${timestamp}]:`, {
        kpis: newConfig.kpis,
        charts: newConfig.charts
      });
      
      return newConfig;
    });
  };

  return {
    config,
    setConfig: setConfigWithUpdate,
    loading,
    setLoading,
    saving,
    setSaving,
    forceUpdate,
    triggerForceUpdate,
    saveTimeoutRef,
    isMountedRef,
    isInitializedRef
  };
};
