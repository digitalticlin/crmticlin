
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
  const isInitializedRef = useRef(false);

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
    if (user && companyId && !isInitializedRef.current) {
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
        // Criar registro inicial no banco de dados
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

  const updateConfig = (newConfig: Partial<DashboardConfig>) => {
    if (!isMountedRef.current || !isInitializedRef.current) {
      console.warn("⚠️ Update config called before initialization");
      return;
    }
    
    console.log("=== UPDATE CONFIG CALLED ===");
    console.log("Current config:", config);
    console.log("Updates:", newConfig);
    
    // Clonar config atual para evitar mutações
    const currentConfigCopy = deepClone(config);
    const updatedConfig = mergeConfigUpdates(currentConfigCopy, newConfig);
    
    console.log("📝 Final updated config:", updatedConfig);
    
    // Update imediato na UI com incremento da versão
    setConfig(updatedConfig);
    setConfigVersion(prev => {
      const newVersion = prev + 1;
      console.log("🔄 Config version updated to:", newVersion);
      return newVersion;
    });
    
    // Forçar re-renderização imediata
    setTimeout(() => {
      if (isMountedRef.current) {
        setConfigVersion(prev => prev + 1);
      }
    }, 0);
    
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
