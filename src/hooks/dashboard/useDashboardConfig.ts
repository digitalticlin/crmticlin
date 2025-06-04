
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyData } from "@/hooks/useCompanyData";

export interface DashboardConfig {
  kpis: {
    novos_leads: boolean;
    total_leads: boolean;
    taxa_conversao: boolean;
    taxa_perda: boolean;
    valor_pipeline: boolean;
    ticket_medio: boolean;
    tempo_resposta: boolean;
  };
  charts: {
    funil_conversao: boolean;
    performance_vendedores: boolean;
    evolucao_temporal: boolean;
    leads_etiquetas: boolean;
    distribuicao_fonte: boolean;
  };
  layout: {
    kpi_order: string[];
    chart_order: string[];
  };
  period_filter: string;
}

const defaultConfig: DashboardConfig = {
  kpis: {
    novos_leads: true,
    total_leads: true,
    taxa_conversao: true,
    taxa_perda: true,
    valor_pipeline: false,
    ticket_medio: false,
    tempo_resposta: false
  },
  charts: {
    funil_conversao: true,
    performance_vendedores: true,
    evolucao_temporal: false,
    leads_etiquetas: false,
    distribuicao_fonte: false
  },
  layout: {
    kpi_order: ["novos_leads", "total_leads", "taxa_conversao", "taxa_perda", "valor_pipeline", "ticket_medio", "tempo_resposta"],
    chart_order: ["funil_conversao", "performance_vendedores", "evolucao_temporal", "leads_etiquetas", "distribuicao_fonte"]
  },
  period_filter: "30"
};

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
      console.log("=== LOADING CONFIG ===");
      console.log("User ID:", user.id, "Company ID:", companyId);
      
      // Primeiro, limpar duplicatas se existirem
      await cleanupDuplicateConfigs();
      
      const { data, error } = await supabase
        .from('dashboard_configs')
        .select('config_data')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && isMountedRef.current) {
        console.log("Config loaded from database:", data.config_data);
        const loadedConfig = data.config_data as unknown as DashboardConfig;
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

  const cleanupDuplicateConfigs = async () => {
    if (!user?.id || !companyId) return;
    
    try {
      const { data: duplicates } = await supabase
        .from('dashboard_configs')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (duplicates && duplicates.length > 1) {
        console.log(`Found ${duplicates.length} duplicate configs, cleaning up...`);
        const idsToDelete = duplicates.slice(1).map(d => d.id);
        
        await supabase
          .from('dashboard_configs')
          .delete()
          .in('id', idsToDelete);
        
        console.log("Duplicate configs cleaned up");
      }
    } catch (error) {
      console.error("Error cleaning up duplicates:", error);
    }
  };

  const saveConfig = async (configToSave: DashboardConfig) => {
    if (!user?.id || !companyId || !isMountedRef.current) return;
    
    setSaving(true);
    
    try {
      console.log("=== SAVING CONFIG ===", configToSave);
      
      const { error } = await supabase
        .from('dashboard_configs')
        .upsert({
          user_id: user.id,
          company_id: companyId,
          config_data: configToSave
        }, {
          onConflict: 'user_id,company_id'
        });

      if (error) throw error;

      lastSavedConfigRef.current = configToSave;
      console.log("Config saved successfully");
      toast.success("Configurações salvas!");
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast.error("Erro ao salvar configurações");
      
      // Rollback em caso de erro
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
    
    // Merge completo para garantir configuração válida
    const updatedConfig: DashboardConfig = {
      kpis: { ...config.kpis, ...(newConfig.kpis || {}) },
      charts: { ...config.charts, ...(newConfig.charts || {}) },
      layout: { ...config.layout, ...(newConfig.layout || {}) },
      period_filter: newConfig.period_filter || config.period_filter
    };
    
    console.log("=== UPDATE CONFIG ===");
    console.log("New config:", updatedConfig);
    
    // Atualização imediata do estado para UI responsiva
    setConfig(updatedConfig);
    const newVersion = Date.now();
    setConfigVersion(newVersion);
    
    // Debounce para salvar no banco
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        saveConfig(updatedConfig);
      }
    }, 500); // Debounce de 500ms
    
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
