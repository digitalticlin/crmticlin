
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyData } from "@/hooks/useCompanyData";
import { DashboardConfig, defaultConfig } from "./types/dashboardConfigTypes";
import { DashboardConfigService } from "./services/dashboardConfigService";
import { mergeConfigUpdates, validateConfig, deepClone } from "./utils/configUtils";

export { type DashboardConfig } from "./types/dashboardConfigTypes";

export const useDashboardConfig = () => {
  // Estados principais
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
  const pendingConfigRef = useRef<DashboardConfig | null>(null);
  const savePromiseRef = useRef<Promise<void> | null>(null);
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
      console.log("User ID:", user.id, "Company ID:", companyId);
      
      const loadedConfig = await DashboardConfigService.retryOperation(
        () => DashboardConfigService.loadConfig(user.id, companyId)
      );
      
      if (loadedConfig && validateConfig(loadedConfig) && isMountedRef.current) {
        console.log("✅ Config loaded from database:", loadedConfig);
        setConfig(loadedConfig);
        setConfigVersion(prev => prev + 1);
        isInitializedRef.current = true;
      } else if (isMountedRef.current) {
        console.log("❌ No valid config found, creating initial config");
        await createInitialConfig();
      }
    } catch (error) {
      console.error("❌ Error loading config:", error);
      toast.error("Erro ao carregar configurações do dashboard");
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
      console.log("🔨 Creating initial config in database");
      await DashboardConfigService.retryOperation(
        () => DashboardConfigService.saveConfig(user.id, companyId, defaultConfig)
      );
      console.log("✅ Initial config created successfully");
      setConfig(defaultConfig);
      setConfigVersion(prev => prev + 1);
      isInitializedRef.current = true;
      toast.success("Dashboard configurado com sucesso!");
    } catch (error) {
      console.error("❌ Error creating initial config:", error);
      toast.error("Erro ao inicializar configurações");
      setConfig(defaultConfig);
      setConfigVersion(prev => prev + 1);
      isInitializedRef.current = true;
    }
  };

  const saveConfigToDatabase = async (configToSave: DashboardConfig): Promise<void> => {
    if (!user?.id || !companyId || !isMountedRef.current) return;
    
    setSaving(true);
    
    try {
      console.log("💾 Saving config to database:", configToSave);
      await DashboardConfigService.retryOperation(
        () => DashboardConfigService.saveConfig(user.id, companyId, configToSave)
      );
      
      console.log("✅ Config saved successfully");
      toast.success("Configurações salvas!");
    } catch (error) {
      console.error("❌ Error saving config:", error);
      toast.error("Erro ao salvar configurações");
      throw error;
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  // Handler principal de atualização - sempre atualizado
  const updateConfig = useCallback((newConfig: Partial<DashboardConfig>) => {
    console.log("=== UPDATE CONFIG TRIGGERED ===");
    console.log("Is initialized:", isInitializedRef.current);
    console.log("Is mounted:", isMountedRef.current);
    console.log("Updates:", newConfig);
    
    if (!isMountedRef.current || !isInitializedRef.current) {
      console.warn("⚠️ Update config called before initialization");
      return;
    }
    
    // Usar setConfig com função para garantir estado mais atual
    setConfig(currentConfig => {
      const currentConfigCopy = deepClone(currentConfig);
      const updatedConfig = mergeConfigUpdates(currentConfigCopy, newConfig);
      
      console.log("📝 Current config:", currentConfigCopy);
      console.log("📝 Final updated config:", updatedConfig);
      
      // Armazenar config pendente para save
      pendingConfigRef.current = updatedConfig;
      
      // Cancelar timeout anterior
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Debounce do salvamento
      saveTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && pendingConfigRef.current) {
          const configToSave = pendingConfigRef.current;
          pendingConfigRef.current = null;
          
          if (!savePromiseRef.current) {
            savePromiseRef.current = saveConfigToDatabase(configToSave)
              .finally(() => {
                savePromiseRef.current = null;
              });
          }
        }
      }, 300);
      
      return updatedConfig;
    });
    
    // Forçar re-renderização
    setConfigVersion(prev => {
      const newVersion = prev + 1;
      console.log("🔄 Config version updated to:", newVersion);
      return newVersion;
    });
  }, [user?.id, companyId]);

  // Handlers específicos - sempre usam o estado atual via setConfig
  const handleKPIToggle = useCallback((kpiKey: keyof DashboardConfig['kpis']) => {
    console.log("=== KPI TOGGLE HANDLER ===");
    console.log("KPI Key:", kpiKey);
    
    setConfig(currentConfig => {
      const currentValue = currentConfig.kpis[kpiKey];
      const newValue = !currentValue;
      
      console.log("Current KPI value:", currentValue);
      console.log("New KPI value:", newValue);
      
      const newConfig = {
        ...currentConfig,
        kpis: {
          ...currentConfig.kpis,
          [kpiKey]: newValue
        }
      };
      
      // Trigger save
      pendingConfigRef.current = newConfig;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && pendingConfigRef.current) {
          const configToSave = pendingConfigRef.current;
          pendingConfigRef.current = null;
          
          if (!savePromiseRef.current) {
            savePromiseRef.current = saveConfigToDatabase(configToSave)
              .finally(() => {
                savePromiseRef.current = null;
              });
          }
        }
      }, 300);
      
      console.log("✅ KPI toggle completed");
      return newConfig;
    });
    
    // Force re-render
    setConfigVersion(prev => prev + 1);
  }, [user?.id, companyId]);

  const handleChartToggle = useCallback((chartKey: keyof DashboardConfig['charts']) => {
    console.log("=== CHART TOGGLE HANDLER ===");
    console.log("Chart Key:", chartKey);
    
    setConfig(currentConfig => {
      const currentValue = currentConfig.charts[chartKey];
      const newValue = !currentValue;
      
      console.log("Current Chart value:", currentValue);
      console.log("New Chart value:", newValue);
      
      const newConfig = {
        ...currentConfig,
        charts: {
          ...currentConfig.charts,
          [chartKey]: newValue
        }
      };
      
      // Trigger save
      pendingConfigRef.current = newConfig;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && pendingConfigRef.current) {
          const configToSave = pendingConfigRef.current;
          pendingConfigRef.current = null;
          
          if (!savePromiseRef.current) {
            savePromiseRef.current = saveConfigToDatabase(configToSave)
              .finally(() => {
                savePromiseRef.current = null;
              });
          }
        }
      }, 300);
      
      console.log("✅ Chart toggle completed");
      return newConfig;
    });
    
    // Force re-render
    setConfigVersion(prev => prev + 1);
  }, [user?.id, companyId]);

  const resetToDefault = useCallback(() => {
    console.log("=== RESET TO DEFAULT ===");
    const defaultConfigCopy = deepClone(defaultConfig);
    updateConfig(defaultConfigCopy);
  }, [updateConfig]);

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
