
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
  
  // Refs para controle de state e debounce
  const pendingUpdatesRef = useRef<Partial<DashboardConfig> | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

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
    try {
      console.log("=== LOADING CONFIG ===");
      const { data, error } = await supabase
        .from('dashboard_configs')
        .select('config_data')
        .eq('user_id', user?.id)
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && isMountedRef.current) {
        console.log("Config loaded from database:", data.config_data);
        const loadedConfig = data.config_data as unknown as DashboardConfig;
        setConfig(loadedConfig);
        setConfigVersion(Date.now());
      } else if (isMountedRef.current) {
        console.log("No config found, creating default...");
        await createDefaultConfig();
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
      toast.error("Erro ao carregar configurações do dashboard");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const createDefaultConfig = async () => {
    try {
      const { error } = await supabase
        .from('dashboard_configs')
        .insert({
          user_id: user?.id,
          company_id: companyId,
          config_data: defaultConfig as any
        });

      if (error) throw error;
      
      if (isMountedRef.current) {
        console.log("Default config created");
        setConfig(defaultConfig);
        setConfigVersion(Date.now());
      }
    } catch (error) {
      console.error("Erro ao criar configuração padrão:", error);
    }
  };

  const debouncedSave = useCallback(async (configToSave: DashboardConfig) => {
    if (!isMountedRef.current) return;
    
    setSaving(true);
    
    try {
      console.log("=== SAVING CONFIG ===", configToSave);
      const { error } = await supabase
        .from('dashboard_configs')
        .upsert({
          user_id: user?.id,
          company_id: companyId,
          config_data: configToSave as any
        });

      if (error) throw error;

      console.log("Config saved successfully");
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  }, [user?.id, companyId]);

  const updateConfig = useCallback(async (newConfig: Partial<DashboardConfig>) => {
    if (!isMountedRef.current) return;
    
    const updatedConfig = { ...config, ...newConfig };
    
    console.log("=== UPDATE CONFIG IMMEDIATE ===");
    console.log("Old config:", config);
    console.log("New config updates:", newConfig);
    console.log("Final config:", updatedConfig);
    
    // Atualização imediata do estado para UI responsiva
    setConfig(updatedConfig);
    const newVersion = Date.now();
    setConfigVersion(newVersion);
    
    // Debounce para salvar no banco
    pendingUpdatesRef.current = updatedConfig;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (pendingUpdatesRef.current && isMountedRef.current) {
        debouncedSave(pendingUpdatesRef.current);
        pendingUpdatesRef.current = null;
      }
    }, 300); // Debounce de 300ms
    
  }, [config, debouncedSave]);

  const resetToDefault = async () => {
    await updateConfig(defaultConfig);
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
