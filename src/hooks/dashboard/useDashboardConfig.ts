
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { companyId } = useCompanyData();

  console.log("useDashboardConfig - user:", !!user, "companyId:", companyId);

  useEffect(() => {
    if (user && companyId) {
      loadConfig();
    } else {
      console.log("useDashboardConfig - sem user ou companyId, usando config padrão");
      setConfig(defaultConfig);
      setLoading(false);
    }
  }, [user, companyId]);

  const loadConfig = async () => {
    try {
      console.log("useDashboardConfig - carregando configuração do banco");
      
      const { data, error } = await supabase
        .from('dashboard_configs')
        .select('config_data')
        .eq('user_id', user?.id)
        .eq('company_id', companyId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao carregar configuração:", error);
        throw error;
      }

      if (data && data.config_data) {
        console.log("useDashboardConfig - configuração carregada:", data.config_data);
        
        // Validar estrutura da configuração carregada
        const loadedConfig = data.config_data as any;
        
        // Verificar se a estrutura é válida
        if (!loadedConfig || typeof loadedConfig !== 'object') {
          console.warn("Configuração carregada inválida, usando padrão");
          setConfig(defaultConfig);
          setLoading(false);
          return;
        }
        
        // Mesclar com configuração padrão para garantir consistência
        const mergedConfig: DashboardConfig = {
          kpis: { 
            ...defaultConfig.kpis, 
            ...(loadedConfig.kpis || {})
          },
          charts: { 
            ...defaultConfig.charts, 
            ...(loadedConfig.charts || {})
          },
          layout: { 
            kpi_order: Array.isArray(loadedConfig.layout?.kpi_order) 
              ? loadedConfig.layout.kpi_order 
              : defaultConfig.layout.kpi_order,
            chart_order: Array.isArray(loadedConfig.layout?.chart_order) 
              ? loadedConfig.layout.chart_order 
              : defaultConfig.layout.chart_order
          },
          period_filter: typeof loadedConfig.period_filter === 'string' 
            ? loadedConfig.period_filter 
            : defaultConfig.period_filter
        };
        
        console.log("useDashboardConfig - configuração mesclada:", mergedConfig);
        setConfig(mergedConfig);
      } else {
        console.log("useDashboardConfig - nenhuma configuração encontrada, usando padrão");
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
      console.log("useDashboardConfig - erro, usando configuração padrão");
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = useCallback(async (newConfig: Partial<DashboardConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig };
      setConfig(updatedConfig);
      setSaving(true);
      
      if (!user?.id || !companyId) {
        console.warn("useDashboardConfig - não é possível salvar sem user ou companyId");
        return;
      }

      const { error } = await supabase
        .from('dashboard_configs')
        .upsert({
          user_id: user?.id,
          company_id: companyId,
          config_data: updatedConfig as any
        });

      if (error) throw error;
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      setConfig(config); // Revert on error
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  }, [config, user?.id, companyId]);

  const resetToDefault = async () => {
    await updateConfig(defaultConfig);
  };

  console.log("useDashboardConfig - retornando config:", config, "loading:", loading);

  return {
    config,
    loading,
    saving,
    updateConfig,
    resetToDefault
  };
};
