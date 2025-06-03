
import { useMemo } from "react";
import { useDashboardState } from "@/hooks/dashboard/useDashboardState";
import { useOptimizedDashboardConfig } from "@/hooks/dashboard/useOptimizedDashboardConfig";
import KPICard from "./KPICard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const kpiConfig = {
  novos_leads: {
    title: "Novos Contatos",
    icon: "userPlus" as const,
    format: (value: number) => value === 0 ? "Nenhum ainda" : value.toString(),
    description: "Contatos que chegaram recentemente"
  },
  total_leads: {
    title: "Total de Contatos",
    icon: "users" as const,
    format: (value: number) => value === 0 ? "Nenhum ainda" : value.toString(),
    description: "Todos os seus contatos"
  },
  taxa_conversao: {
    title: "Vendas Realizadas",
    icon: "trendingUp" as const,
    format: (value: number) => value === 0 ? "Nenhuma ainda" : `${value}%`,
    description: "Percentual de contatos que se tornaram clientes"
  },
  taxa_perda: {
    title: "Oportunidades Perdidas",
    icon: "trendingUp" as const,
    format: (value: number) => value === 0 ? "Nenhuma ainda" : `${value}%`,
    description: "Contatos que não se interessaram"
  },
  valor_pipeline: {
    title: "Oportunidades em Andamento",
    icon: "trendingUp" as const,
    format: (value: number) => value === 0 ? "Nenhuma ainda" : `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    description: "Valor total das vendas em negociação"
  },
  ticket_medio: {
    title: "Valor Médio por Venda",
    icon: "trendingUp" as const,
    format: (value: number) => value === 0 ? "Nenhuma ainda" : `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    description: "Valor médio de cada venda realizada"
  },
  tempo_resposta: {
    title: "Tempo de Resposta",
    icon: "messageSquare" as const,
    format: (value: number) => {
      if (value === 0) return "Nenhum ainda";
      if (value < 60) return `${Math.round(value)}min`;
      const hours = Math.floor(value / 60);
      const minutes = Math.round(value % 60);
      return `${hours}h ${minutes}min`;
    },
    description: "Tempo médio para responder mensagens"
  }
};

const DEFAULT_KPIS = ['novos_leads', 'total_leads', 'taxa_conversao', 'valor_pipeline'];

function KPIGridContent() {
  const { config, loading: configLoading } = useOptimizedDashboardConfig();
  const { kpis, loading: kpisLoading, error } = useDashboardState(config?.period_filter || "30", config);

  console.log("OptimizedKPIGrid - configLoading:", configLoading, "kpisLoading:", kpisLoading, "error:", error);

  // Memoizar KPIs visíveis
  const visibleKPIs = useMemo(() => {
    if (!config || configLoading) {
      return DEFAULT_KPIS;
    }
    
    if (!config.layout?.kpi_order || !config.kpis) {
      return DEFAULT_KPIS;
    }
    
    const enabled = config.layout.kpi_order.filter(kpiKey => {
      if (typeof kpiKey !== 'string') return false;
      return config.kpis[kpiKey as keyof typeof config.kpis];
    });
    
    return enabled.length > 0 ? enabled : DEFAULT_KPIS;
  }, [config, configLoading]);

  // Loading state
  if (configLoading || kpisLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-white/20 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Error state com fallback
  if (error) {
    console.warn("OptimizedKPIGrid - erro:", error);
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

  return (
    <div className={`grid ${getGridCols(visibleKPIs.length)} gap-4 md:gap-6`}>
      {visibleKPIs.map((kpiKey) => {
        const kpiData = kpiConfig[kpiKey as keyof typeof kpiConfig];
        
        if (!kpiData) {
          console.warn(`KPI config not found for key: ${kpiKey}`);
          return null;
        }

        // Valor do KPI com fallback
        let kpiValue = 0;
        if (kpis && typeof kpis === 'object' && kpiKey in kpis) {
          const value = kpis[kpiKey as keyof typeof kpis];
          if (typeof value === 'number') {
            kpiValue = value;
          }
        }

        // Trend com fallback
        const defaultTrend = { value: 0, isPositive: true };
        let trend = defaultTrend;
        
        if (kpis?.trends && typeof kpis.trends === 'object' && kpiKey in kpis.trends) {
          const trendValue = kpis.trends[kpiKey as keyof typeof kpis.trends];
          if (trendValue && typeof trendValue === 'object' && 'value' in trendValue && 'isPositive' in trendValue) {
            trend = trendValue;
          }
        }
        
        return (
          <ErrorBoundary 
            key={kpiKey} 
            fallback={
              <div className="h-32 bg-white/20 rounded-3xl flex items-center justify-center">
                <span className="text-gray-500 text-sm">Erro no carregamento</span>
              </div>
            }
          >
            <KPICard
              title={kpiData.title}
              value={kpiData.format(kpiValue)}
              trend={kpiValue > 0 ? trend : undefined}
              icon={kpiData.icon}
              description={kpiData.description}
            />
          </ErrorBoundary>
        );
      })}
    </div>
  );
}

export function OptimizedKPIGrid() {
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
