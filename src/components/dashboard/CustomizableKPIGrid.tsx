
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import { useDashboardKPIs } from "@/hooks/dashboard/useDashboardKPIs";
import { useDemoMode } from "@/hooks/dashboard/useDemoMode";
import KPICard from "./KPICard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useMemo } from "react";

const kpiConfig = {
  novos_leads: {
    title: "Novos Leads",
    icon: "userPlus" as const,
    format: (value: number) => value.toString()
  },
  total_leads: {
    title: "Total de Leads",
    icon: "users" as const,
    format: (value: number) => value.toString()
  },
  taxa_conversao: {
    title: "Taxa de Conversão",
    icon: "trendingUp" as const,
    format: (value: number) => `${value}%`
  },
  taxa_perda: {
    title: "Taxa de Perda",
    icon: "trendingUp" as const,
    format: (value: number) => `${value}%`
  },
  valor_pipeline: {
    title: "Valor do Pipeline",
    icon: "trendingUp" as const,
    format: (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  },
  ticket_medio: {
    title: "Ticket Médio",
    icon: "trendingUp" as const,
    format: (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  },
  tempo_resposta: {
    title: "Tempo de Resposta",
    icon: "messageSquare" as const,
    format: (value: number) => {
      if (value < 60) return `${Math.round(value)}min`;
      const hours = Math.floor(value / 60);
      const minutes = Math.round(value % 60);
      return `${hours}h ${minutes}min`;
    }
  }
};

// KPIs padrão sempre visíveis
const DEFAULT_KPIS = ['novos_leads', 'total_leads', 'taxa_conversao', 'valor_pipeline'];

function KPIGridContent() {
  const { config, loading: configLoading } = useDashboardConfig();
  const { kpis, loading: kpisLoading } = useDashboardKPIs(config?.period_filter || "30");
  const { isDemoMode } = useDemoMode();

  console.log("KPIGridContent - configLoading:", configLoading, "kpisLoading:", kpisLoading);
  console.log("KPIGridContent - config:", config);
  console.log("KPIGridContent - kpis:", kpis);
  console.log("KPIGridContent - isDemoMode:", isDemoMode);

  const visibleKPIs = useMemo(() => {
    // Se não há configuração, usar KPIs padrão
    if (!config || !config.layout || !config.layout.kpi_order) {
      console.log("Usando KPIs padrão devido à falta de configuração");
      return DEFAULT_KPIS;
    }
    
    // Se não há KPIs configurados, usar padrão
    if (!config.kpis) {
      console.log("Usando KPIs padrão devido à falta de config.kpis");
      return DEFAULT_KPIS;
    }
    
    // Filtrar KPIs habilitados
    const enabled = config.layout.kpi_order.filter(kpiKey => {
      const isEnabled = config.kpis[kpiKey as keyof typeof config.kpis];
      console.log(`KPI ${kpiKey} habilitado:`, isEnabled);
      return isEnabled;
    });
    
    // Se nenhum KPI habilitado, usar padrão
    if (enabled.length === 0) {
      console.log("Nenhum KPI habilitado, usando padrão");
      return DEFAULT_KPIS;
    }
    
    return enabled;
  }, [config]);

  console.log("visibleKPIs final:", visibleKPIs);

  // Estados de loading
  if (configLoading || kpisLoading) {
    console.log("Renderizando estado de loading");
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-white/20 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Grid dinâmico baseado no número de KPIs
  const getGridCols = (count: number) => {
    if (count === 1) return "grid-cols-1 max-w-sm mx-auto";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto";
    if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    if (count <= 4) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
    if (count <= 6) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";
  };

  console.log("Renderizando grid com", visibleKPIs.length, "KPIs");

  return (
    <div className={`grid ${getGridCols(visibleKPIs.length)} gap-4 md:gap-6`}>
      {visibleKPIs.map((kpiKey) => {
        const kpiData = kpiConfig[kpiKey as keyof typeof kpiConfig];
        
        if (!kpiData) {
          console.warn(`KPI config not found for key: ${kpiKey}`);
          return null;
        }

        // Verificar se a chave existe nos KPIs e garantir que é um número
        let kpiValue = 0;
        if (kpis && typeof kpis === 'object' && kpiKey in kpis) {
          const value = kpis[kpiKey as keyof typeof kpis];
          if (typeof value === 'number') {
            kpiValue = value;
          }
        }

        // Trend padrão se não existir
        const defaultTrend = { value: 0, isPositive: true };
        let trend = defaultTrend;
        
        if (kpis && kpis.trends && typeof kpis.trends === 'object' && kpiKey in kpis.trends) {
          const trendValue = kpis.trends[kpiKey as keyof typeof kpis.trends];
          if (trendValue && typeof trendValue === 'object' && 'value' in trendValue && 'isPositive' in trendValue) {
            trend = trendValue;
          }
        }

        console.log(`Renderizando KPI ${kpiKey} com valor:`, kpiValue, "trend:", trend);
        
        return (
          <ErrorBoundary 
            key={kpiKey} 
            fallback={
              <div className="h-32 bg-white/20 rounded-3xl flex items-center justify-center">
                <span className="text-gray-500 text-sm">Erro no KPI</span>
              </div>
            }
          >
            <KPICard
              title={kpiData.title}
              value={kpiData.format(kpiValue)}
              trend={trend}
              icon={kpiData.icon}
            />
          </ErrorBoundary>
        );
      })}
    </div>
  );
}

export function CustomizableKPIGrid() {
  console.log("CustomizableKPIGrid renderizando");
  return (
    <ErrorBoundary
      fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {DEFAULT_KPIS.map((kpiKey) => {
            const kpiData = kpiConfig[kpiKey as keyof typeof kpiConfig];
            return (
              <div key={kpiKey} className="h-32 bg-white/20 rounded-3xl flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-700">{kpiData.title}</h3>
                  <p className="text-xs text-gray-500 mt-2">Erro no carregamento</p>
                </div>
              </div>
            );
          })}
        </div>
      }
    >
      <KPIGridContent />
    </ErrorBoundary>
  );
}
