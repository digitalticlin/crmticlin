
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
  
  // Refs para evitar stale closures
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const pendingConfigRef = useRef<DashboardConfig | null>(null);
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const isInitializedRef = useRef(false);
  const currentConfigRef = useRef<DashboardConfig>(defaultConfig);
  const updateHandlersRef = useRef<{
    kpiToggle: (kpiKey: keyof DashboardConfig['kpis']) => void;
    chartToggle: (chartKey: keyof DashboardConfig['charts']) => void;
  } | null>(null);

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

  // Sempre manter currentConfigRef atualizado
  useEffect(() => {
    currentConfigRef.current = config;
    console.log("📝 Config ref updated:", config);
  }, [config]);

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
        currentConfigRef.current = loadedConfig;
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
        currentConfigRef.current = defaultConfig;
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
      currentConfigRef.current = defaultConfig;
      setConfigVersion(prev => prev + 1);
      isInitializedRef.current = true;
      toast.success("Dashboard configurado com sucesso!");
    } catch (error) {
      console.error("❌ Error creating initial config:", error);
      toast.error("Erro ao inicializar configurações");
      setConfig(defaultConfig);
      currentConfigRef.current = defaultConfig;
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

  // Handler principal de atualização - ESTÁVEL
  const updateConfig = useCallback((newConfig: Partial<DashboardConfig>) => {
    console.log("=== UPDATE CONFIG TRIGGERED ===");
    console.log("Is initialized:", isInitializedRef.current);
    console.log("Is mounted:", isMountedRef.current);
    console.log("Updates:", newConfig);
    
    if (!isMountedRef.current || !isInitializedRef.current) {
      console.warn("⚠️ Update config called before initialization");
      return;
    }
    
    // Usar sempre o config atual do ref para evitar stale closures
    const currentConfigCopy = deepClone(currentConfigRef.current);
    const updatedConfig = mergeConfigUpdates(currentConfigCopy, newConfig);
    
    console.log("📝 Current config:", currentConfigCopy);
    console.log("📝 Final updated config:", updatedConfig);
    
    // Update IMEDIATO na UI e refs
    setConfig(updatedConfig);
    currentConfigRef.current = updatedConfig;
    
    // Forçar re-renderização imediata
    setConfigVersion(prev => {
      const newVersion = prev + 1;
      console.log("🔄 Config version updated to:", newVersion);
      return newVersion;
    });
    
    // Armazenar config pendente para save
    pendingConfigRef.current = updatedConfig;
    
    // Cancelar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce do salvamento (reduzido para 300ms)
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
    }, 300);
  }, []); // SEM DEPENDÊNCIAS para evitar stale closures

  // Handlers específicos ESTÁVEIS
  const handleKPIToggle = useCallback((kpiKey: keyof DashboardConfig['kpis']) => {
    console.log("=== KPI TOGGLE HANDLER ===");
    console.log("KPI Key:", kpiKey);
    console.log("Current config from ref:", currentConfigRef.current);
    
    const currentValue = currentConfigRef.current.kpis[kpiKey];
    const newValue = !currentValue;
    
    console.log("Current KPI value:", currentValue);
    console.log("New KPI value:", newValue);
    
    updateConfig({
      kpis: {
        ...currentConfigRef.current.kpis,
        [kpiKey]: newValue
      }
    });
    
    console.log("✅ KPI toggle completed");
  }, []); // SEM DEPENDÊNCIAS

  const handleChartToggle = useCallback((chartKey: keyof DashboardConfig['charts']) => {
    console.log("=== CHART TOGGLE HANDLER ===");
    console.log("Chart Key:", chartKey);
    console.log("Current config from ref:", currentConfigRef.current);
    
    const currentValue = currentConfigRef.current.charts[chartKey];
    const newValue = !currentValue;
    
    console.log("Current Chart value:", currentValue);
    console.log("New Chart value:", newValue);
    
    updateConfig({
      charts: {
        ...currentConfigRef.current.charts,
        [chartKey]: newValue
      }
    });
    
    console.log("✅ Chart toggle completed");
  }, []); // SEM DEPENDÊNCIAS

  const resetToDefault = useCallback(() => {
    console.log("=== RESET TO DEFAULT ===");
    const defaultConfigCopy = deepClone(defaultConfig);
    updateConfig(defaultConfigCopy);
  }, []); // SEM DEPENDÊNCIAS

  // Atualizar ref dos handlers
  useEffect(() => {
    updateHandlersRef.current = {
      kpiToggle: handleKPIToggle,
      chartToggle: handleChartToggle
    };
  }, [handleKPIToggle, handleChartToggle]);

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
