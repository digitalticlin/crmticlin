
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

// Cache simples para configuração
const configCache = new Map<string, { config: DashboardConfig; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export const useDashboardConfig = () => {
  const [config, setConfig] = useState<DashboardConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { companyId } = useCompanyData();
  
  // Refs para controlar requests e debounce
  const loadConfigController = useRef<AbortController | null>(null);
  const saveConfigTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user && companyId) {
      loadConfig();
    } else {
      setLoading(false);
    }
    
    return () => {
      if (loadConfigController.current) {
        loadConfigController.current.abort();
      }
      if (saveConfigTimer.current) {
        clearTimeout(saveConfigTimer.current);
      }
    };
  }, [user, companyId]);

  const loadConfig = async () => {
    if (!user?.id || !companyId) return;
    
    // Verificar cache primeiro
    const cacheKey = `${user.id}-${companyId}`;
    const cached = configCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setConfig(cached.config);
      setLoading(false);
      return;
    }

    // Cancelar request anterior se existir
    if (loadConfigController.current) {
      loadConfigController.current.abort();
    }
    
    loadConfigController.current = new AbortController();

    try {
      const { data, error } = await supabase
        .from('dashboard_configs')
        .select('config_data')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .abortSignal(loadConfigController.current.signal)
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
      
      // Atualizar cache
      configCache.set(cacheKey, { config: finalConfig, timestamp: Date.now() });
      setConfig(finalConfig);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.warn("Erro ao carregar configuração:", error);
        toast.error("Erro ao carregar configurações do dashboard");
      }
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = useCallback(async (newConfig: Partial<DashboardConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    
    // Debounce para salvar
    if (saveConfigTimer.current) {
      clearTimeout(saveConfigTimer.current);
    }
    
    saveConfigTimer.current = setTimeout(async () => {
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
        
        // Atualizar cache
        const cacheKey = `${user.id}-${companyId}`;
        configCache.set(cacheKey, { config: updatedConfig, timestamp: Date.now() });
        
        toast.success("Configurações salvas!");
      } catch (error) {
        console.error("Erro ao salvar configuração:", error);
        setConfig(config); // Revert on error
        toast.error("Erro ao salvar configurações");
      } finally {
        setSaving(false);
      }
    }, 1000); // Debounce de 1 segundo
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
