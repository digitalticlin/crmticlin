
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyData } from "@/hooks/useCompanyData";
import { DashboardConfig, defaultConfig } from "./types/dashboardConfigTypes";
import { DashboardConfigService } from "./services/dashboardConfigService";
import { mergeConfigUpdates, validateConfig, deepClone } from "./utils/configUtils";

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
  const pendingConfigRef = useRef<DashboardConfig | null>(null);
  const savePromiseRef = useRef<Promise<void> | null>(null);

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
      setLoading(true);
      const loadedConfig = await DashboardConfigService.retryOperation(
        () => DashboardConfigService.loadConfig(user.id, companyId)
      );
      
      if (loadedConfig && validateConfig(loadedConfig) && isMountedRef.current) {
        console.log("Setting loaded config:", loadedConfig);
        setConfig(loadedConfig);
        setConfigVersion(Date.now());
      } else if (isMountedRef.current) {
        console.log("No valid config found, using default config");
        setConfig(defaultConfig);
        setConfigVersion(Date.now());
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
      toast.error("Erro ao carregar configurações do dashboard");
      if (isMountedRef.current) {
        setConfig(defaultConfig);
        setConfigVersion(Date.now());
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const saveConfigToDatabase = async (configToSave: DashboardConfig): Promise<void> => {
    if (!user?.id || !companyId || !isMountedRef.current) return;
    
    setSaving(true);
    
    try {
      await DashboardConfigService.retryOperation(
        () => DashboardConfigService.saveConfig(user.id, companyId, configToSave)
      );
      
      console.log("Config saved successfully:", configToSave);
      toast.success("Configurações salvas!");
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast.error("Erro ao salvar configurações");
      throw error;
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  const updateConfig = (newConfig: Partial<DashboardConfig>) => {
    if (!isMountedRef.current) return;
    
    console.log("=== UPDATE CONFIG CALLED ===");
    console.log("Current config:", config);
    console.log("Updates:", newConfig);
    
    // Clonar config atual para evitar mutações
    const currentConfigCopy = deepClone(config);
    const updatedConfig = mergeConfigUpdates(currentConfigCopy, newConfig);
    
    console.log("Final updated config:", updatedConfig);
    
    // Update imediato na UI
    setConfig(updatedConfig);
    setConfigVersion(Date.now());
    
    // Armazenar config pendente
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
        
        // Evitar múltiplos saves simultâneos
        if (!savePromiseRef.current) {
          savePromiseRef.current = saveConfigToDatabase(configToSave)
            .finally(() => {
              savePromiseRef.current = null;
            });
        }
      }
    }, 800);
  };

  const resetToDefault = () => {
    console.log("=== RESET TO DEFAULT ===");
    const defaultConfigCopy = deepClone(defaultConfig);
    updateConfig(defaultConfigCopy);
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
