
import { useState, useEffect } from "react";
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
    valor_pipeline: true,
    ticket_medio: true,
    tempo_resposta: true
  },
  charts: {
    funil_conversao: true,
    performance_vendedores: true,
    evolucao_temporal: true,
    leads_etiquetas: true,
    distribuicao_fonte: true
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
  const [configVersion, setConfigVersion] = useState(0); // Force re-renders
  const { user } = useAuth();
  const { companyId } = useCompanyData();

  useEffect(() => {
    if (user && companyId) {
      loadConfig();
    }
  }, [user, companyId]);

  const loadConfig = async () => {
    try {
      console.log("Loading dashboard config...");
      const { data, error } = await supabase
        .from('dashboard_configs')
        .select('config_data')
        .eq('user_id', user?.id)
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        console.log("Config loaded from database:", data.config_data);
        const newConfig = data.config_data as unknown as DashboardConfig;
        setConfig(newConfig);
        setConfigVersion(prev => prev + 1);
      } else {
        console.log("No config found, creating default...");
        await createDefaultConfig();
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
      toast.error("Erro ao carregar configurações do dashboard");
    } finally {
      setLoading(false);
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
      console.log("Default config created");
      setConfig(defaultConfig);
      setConfigVersion(prev => prev + 1);
    } catch (error) {
      console.error("Erro ao criar configuração padrão:", error);
    }
  };

  const updateConfig = async (newConfig: Partial<DashboardConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    console.log("=== UPDATE CONFIG ===");
    console.log("Old config:", config);
    console.log("New config:", updatedConfig);
    
    // Update state immediately for instant UI feedback
    setConfig(updatedConfig);
    setConfigVersion(prev => prev + 1);
    setSaving(true);
    
    try {
      console.log("Saving config to database:", updatedConfig);
      const { error } = await supabase
        .from('dashboard_configs')
        .upsert({
          user_id: user?.id,
          company_id: companyId,
          config_data: updatedConfig as any
        });

      if (error) throw error;

      console.log("Config saved successfully");
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      // Revert to previous config on error
      setConfig(config);
      setConfigVersion(prev => prev + 1);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

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
