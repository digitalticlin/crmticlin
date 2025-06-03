
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

function KPIGridContent() {
  const { config, loading: configLoading } = useDashboardConfig();
  const { kpis, loading: kpisLoading } = useDashboardKPIs(config.period_filter);
  const { isDemoMode } = useDemoMode();

  const visibleKPIs = useMemo(() => {
    if (!config?.layout?.kpi_order || !config?.kpis) {
      // Fallback para ordem padrão se não houver configuração
      return ['novos_leads', 'total_leads', 'taxa_conversao', 'valor_pipeline'];
    }
    
    return config.layout.kpi_order.filter(kpiKey => {
      return config.kpis[kpiKey as keyof typeof config.kpis];
    });
  }, [config?.kpis, config?.layout?.kpi_order]);

  if (configLoading || kpisLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-white/20 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (visibleKPIs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>Nenhum KPI selecionado. Configure o dashboard para visualizar os dados.</p>
        {isDemoMode && (
          <p className="text-sm text-blue-600 mt-2">
            Modo Demo ativo - dados de demonstração disponíveis
          </p>
        )}
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

  return (
    <div className={`grid ${getGridCols(visibleKPIs.length)} gap-4 md:gap-6`}>
      {visibleKPIs.map((kpiKey) => {
        const kpiData = kpiConfig[kpiKey as keyof typeof kpiConfig];
        
        if (!kpiData) {
          console.warn(`KPI config not found for key: ${kpiKey}`);
          return null;
        }

        // Verificar se a chave existe nos KPIs e se não é 'trends'
        const kpiValue = (kpiKey !== 'trends' && kpis && typeof kpis[kpiKey as keyof typeof kpis] === 'number') 
          ? kpis[kpiKey as keyof typeof kpis] as number 
          : 0;

        const trend = kpis?.trends?.[kpiKey as keyof typeof kpis.trends] || { value: 0, isPositive: true };
        
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
  return (
    <ErrorBoundary>
      <KPIGridContent />
    </ErrorBoundary>
  );
}
