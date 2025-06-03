
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOptimizedAuth } from "@/contexts/OptimizedAuthContext";
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

export const useOptimizedDashboardConfig = () => {
  const [config, setConfig] = useState<DashboardConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { user } = useOptimizedAuth();
  const { companyId } = useCompanyData();
  
  // Refs para controle
  const mountedRef = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    
    if (user && companyId) {
      loadConfig();
    } else {
      console.log("useOptimizedDashboardConfig - usando config padrão");
      setConfig(defaultConfig);
      setLoading(false);
    }

    return () => {
      mountedRef.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user, companyId]);

  const loadConfig = useCallback(async () => {
    if (!user?.id || !companyId) return;

    try {
      console.log("useOptimizedDashboardConfig - carregando configuração");
      
      const { data, error } = await supabase
        .from('dashboard_configs')
        .select('config_data')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao carregar configuração:", error);
        setConfig(defaultConfig);
        setLoading(false);
        return;
      }

      if (data?.config_data) {
        const loadedConfig = data.config_data as any;
        
        // Validar e mesclar configuração
        const mergedConfig: DashboardConfig = {
          kpis: { ...defaultConfig.kpis, ...(loadedConfig.kpis || {}) },
          charts: { ...defaultConfig.charts, ...(loadedConfig.charts || {}) },
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
        
        setConfig(mergedConfig);
      } else {
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
      setConfig(defaultConfig);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id, companyId]);

  // Update com debounce para evitar múltiplas chamadas
  const updateConfig = useCallback(async (newConfig: Partial<DashboardConfig>) => {
    if (!user?.id || !companyId) return;

    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);

    // Debounce para salvar
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;

      try {
        setSaving(true);
        
        const { error } = await supabase
          .from('dashboard_configs')
          .upsert({
            user_id: user.id,
            company_id: companyId,
            config_data: updatedConfig as any
          });

        if (error) throw error;
        
        if (mountedRef.current) {
          toast.success("Configurações salvas!");
        }
      } catch (error) {
        console.error("Erro ao salvar configuração:", error);
        if (mountedRef.current) {
          setConfig(config); // Revert
          toast.error("Erro ao salvar configurações");
        }
      } finally {
        if (mountedRef.current) {
          setSaving(false);
        }
      }
    }, 1000);
  }, [config, user?.id, companyId]);

  const resetToDefault = useCallback(async () => {
    await updateConfig(defaultConfig);
  }, [updateConfig]);

  return useMemo(() => ({
    config,
    loading,
    saving,
    updateConfig,
    resetToDefault
  }), [config, loading, saving, updateConfig, resetToDefault]);
};
