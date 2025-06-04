
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyData } from "@/hooks/useCompanyData";
import { DashboardConfig, defaultConfig } from "./types/dashboardConfigTypes";
import { DashboardConfigService } from "./services/dashboardConfigService";
import { validateConfig, deepClone } from "./utils/configUtils";

export { type DashboardConfig } from "./types/dashboardConfigTypes";

export const useDashboardConfig = () => {
  // Estados principais simplificados
  const [config, setConfig] = useState<DashboardConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configVersion, setConfigVersion] = useState(0);
  
  // Hooks sempre chamados na mesma ordem
  const { user } = useAuth();
  const { companyId } = useCompanyData();
  
  // Refs para controle interno
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const isInitializedRef = useRef(false);

  // Cleanup effect
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Load config effect
  useEffect(() => {
    if (user && companyId && !isInitializedRef.current) {
      console.log("🔄 Loading config for user:", user.id, "company:", companyId);
      loadConfig();
    }
  }, [user, companyId]);

  const loadConfig = async () => {
    if (!user?.id || !companyId) return;
    
    try {
      setLoading(true);
      console.log("=== LOADING CONFIG ===");
      
      const loadedConfig = await DashboardConfigService.retryOperation(
        () => DashboardConfigService.loadConfig(user.id, companyId)
      );
      
      if (loadedConfig && validateConfig(loadedConfig) && isMountedRef.current) {
        console.log("✅ Config loaded:", loadedConfig);
        setConfig(loadedConfig);
        setConfigVersion(prev => prev + 1);
        isInitializedRef.current = true;
      } else if (isMountedRef.current) {
        console.log("❌ Creating initial config");
        await createInitialConfig();
      }
    } catch (error) {
      console.error("❌ Error loading config:", error);
      if (isMountedRef.current) {
        setConfig(defaultConfig);
        setConfigVersion(prev => prev + 1);
        isInitializedRef.current = true;
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const createInitialConfig = async () => {
    if (!user?.id || !companyId) return;
    
    try {
      console.log("🔨 Creating initial config");
      await DashboardConfigService.retryOperation(
        () => DashboardConfigService.saveConfig(user.id, companyId, defaultConfig)
      );
      console.log("✅ Initial config created");
      setConfig(defaultConfig);
      setConfigVersion(prev => prev + 1);
      isInitializedRef.current = true;
    } catch (error) {
      console.error("❌ Error creating initial config:", error);
      setConfig(defaultConfig);
      setConfigVersion(prev => prev + 1);
      isInitializedRef.current = true;
    }
  };

  // Save com debounce apenas para persistência
  const scheduleSave = useCallback((configToSave: DashboardConfig) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current || !user?.id || !companyId) return;
      
      setSaving(true);
      try {
        console.log("💾 Saving config");
        await DashboardConfigService.retryOperation(
          () => DashboardConfigService.saveConfig(user.id, companyId, configToSave)
        );
        console.log("✅ Config saved");
      } catch (error) {
        console.error("❌ Save error:", error);
        toast.error("Erro ao salvar configurações");
      } finally {
        if (isMountedRef.current) {
          setSaving(false);
        }
      }
    }, 500);
  }, [user?.id, companyId]);

  // HANDLERS SIMPLIFICADOS - SEM DEBOUNCE PARA UI
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
      
      // Save em background
      scheduleSave(newConfig);
      
      return newConfig;
    });
    
    // FORÇAR RE-RENDER IMEDIATO
    setConfigVersion(prev => prev + 1);
  }, [scheduleSave]);

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
      
      // Save em background
      scheduleSave(newConfig);
      
      return newConfig;
    });
    
    // FORÇAR RE-RENDER IMEDIATO
    setConfigVersion(prev => prev + 1);
  }, [scheduleSave]);

  const updateConfig = useCallback((newConfig: Partial<DashboardConfig>) => {
    if (!isMountedRef.current || !isInitializedRef.current) return;
    
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
    
    setConfigVersion(prev => prev + 1);
  }, [scheduleSave]);

  const resetToDefault = useCallback(() => {
    console.log("🔄 RESET TO DEFAULT");
    const defaultConfigCopy = deepClone(defaultConfig);
    setConfig(defaultConfigCopy);
    setConfigVersion(prev => prev + 1);
    scheduleSave(defaultConfigCopy);
  }, [scheduleSave]);

  return {
    config,
    loading,
    saving,
    configVersion,
    updateConfig,
    resetToDefault,
    handleKPIToggle,
    handleChartToggle
  };
};
