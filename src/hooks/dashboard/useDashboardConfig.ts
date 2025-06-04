
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyData } from "@/hooks/useCompanyData";
import { DashboardConfig, defaultConfig } from "./types/dashboardConfigTypes";
import { DashboardConfigService } from "./services/dashboardConfigService";
import { mergeConfigUpdates } from "./utils/configUtils";

export { type DashboardConfig } from "./types/dashboardConfigTypes";

export const useDashboardConfig = () => {
  const [config, setConfig] = useState<DashboardConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configVersion, setConfigVersion] = useState(0);
  const { user } = useAuth();
  const { companyId } = useCompanyData();
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const lastSavedConfigRef = useRef<DashboardConfig>(defaultConfig);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (user && companyId) {
      loadConfig();
    }
  }, [user, companyId]);

  const loadConfig = async () => {
    if (!user?.id || !companyId) return;
    
    try {
      const loadedConfig = await DashboardConfigService.loadConfig(user.id, companyId);
      
      if (loadedConfig && isMountedRef.current) {
        setConfig(loadedConfig);
        lastSavedConfigRef.current = loadedConfig;
        setConfigVersion(Date.now());
      } else if (isMountedRef.current) {
        console.log("No config found, using default config");
        setConfig(defaultConfig);
        lastSavedConfigRef.current = defaultConfig;
        setConfigVersion(Date.now());
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
      toast.error("Erro ao carregar configurações do dashboard");
      if (isMountedRef.current) {
        setConfig(defaultConfig);
        lastSavedConfigRef.current = defaultConfig;
        setConfigVersion(Date.now());
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const saveConfig = async (configToSave: DashboardConfig) => {
    if (!user?.id || !companyId || !isMountedRef.current) return;
    
    setSaving(true);
    
    try {
      await DashboardConfigService.saveConfig(user.id, companyId, configToSave);
      
      lastSavedConfigRef.current = configToSave;
      toast.success("Configurações salvas!");
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast.error("Erro ao salvar configurações");
      
      // Rollback on error
      if (isMountedRef.current) {
        setConfig(lastSavedConfigRef.current);
        setConfigVersion(Date.now());
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  const updateConfig = useCallback((newConfig: Partial<DashboardConfig>) => {
    if (!isMountedRef.current) return;
    
    const updatedConfig = mergeConfigUpdates(config, newConfig);
    
    console.log("=== UPDATE CONFIG ===");
    console.log("New config:", updatedConfig);
    
    // Immediate state update for responsive UI
    setConfig(updatedConfig);
    const newVersion = Date.now();
    setConfigVersion(newVersion);
    
    // Debounce database save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        saveConfig(updatedConfig);
      }
    }, 500); // 500ms debounce
    
  }, [config, user?.id, companyId]);

  const resetToDefault = async () => {
    console.log("=== RESET TO DEFAULT ===");
    updateConfig(defaultConfig);
  };

  return {
    config,
    loading,
    saving,
    configVersion,
    updateConfig,
    resetToDefault
  };
};
