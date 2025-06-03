
import { useState, useEffect, useCallback } from "react";
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { companyId } = useCompanyData();

  const loadConfig = useCallback(async () => {
    if (!user?.id || !companyId) {
      setConfig(defaultConfig);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('dashboard_configs')
        .select('config_data')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      let finalConfig = defaultConfig;
      
      if (data && data.config_data) {
        const loadedConfig = data.config_data as unknown as DashboardConfig;
        
        // Validar e mesclar com configuração padrão
        finalConfig = {
          ...defaultConfig,
          ...loadedConfig,
          kpis: { ...defaultConfig.kpis, ...loadedConfig.kpis },
          charts: { ...defaultConfig.charts, ...loadedConfig.charts },
          layout: { ...defaultConfig.layout, ...loadedConfig.layout }
        };
      }
      
      setConfig(finalConfig);
    } catch (error: any) {
      console.warn("Erro ao carregar configuração:", error);
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  }, [user?.id, companyId]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateConfig = useCallback(async (newConfig: Partial<DashboardConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    
    // Debounce para salvar
    const timer = setTimeout(async () => {
      setSaving(true);
      
      try {
        if (!user?.id || !companyId) {
          return;
        }

        const { error } = await supabase
          .from('dashboard_configs')
          .upsert({
            user_id: user.id,
            company_id: companyId,
            config_data: updatedConfig as any
          });

        if (error) throw error;
        
        toast.success("Configurações salvas!");
      } catch (error) {
        console.error("Erro ao salvar configuração:", error);
        setConfig(config); // Revert on error
        toast.error("Erro ao salvar configurações");
      } finally {
        setSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [config, user?.id, companyId]);

  const resetToDefault = async () => {
    await updateConfig(defaultConfig);
  };

  return {
    config,
    loading,
    saving,
    updateConfig,
    resetToDefault
  };
};
