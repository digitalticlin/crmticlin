
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import { useDashboardKPIs } from "@/hooks/dashboard/useDashboardKPIs";
import KPICard from "./KPICard";

const kpiConfig = {
  novos_leads: {
    title: "Novos Leads",
    icon: "userPlus" as const,
    format: (value: number) => value.toString(),
    trend: { value: 12, isPositive: true }
  },
  total_leads: {
    title: "Total de Leads",
    icon: "users" as const,
    format: (value: number) => value.toString(),
    trend: { value: 8, isPositive: true }
  },
  taxa_conversao: {
    title: "Taxa de Conversão",
    icon: "trendingUp" as const,
    format: (value: number) => `${value}%`,
    trend: { value: 5, isPositive: true }
  },
  taxa_perda: {
    title: "Taxa de Perda",
    icon: "trendingUp" as const,
    format: (value: number) => `${value}%`,
    trend: { value: 3, isPositive: false }
  },
  valor_pipeline: {
    title: "Valor do Pipeline",
    icon: "trendingUp" as const,
    format: (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    trend: { value: 15, isPositive: true }
  },
  ticket_medio: {
    title: "Ticket Médio",
    icon: "trendingUp" as const,
    format: (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    trend: { value: 7, isPositive: true }
  },
  tempo_resposta: {
    title: "Tempo de Resposta",
    icon: "messageSquare" as const,
    format: (value: number) => {
      if (value < 60) return `${Math.round(value)}min`;
      const hours = Math.floor(value / 60);
      const minutes = Math.round(value % 60);
      return `${hours}h ${minutes}min`;
    },
    trend: { value: 2, isPositive: false }
  }
};

export function CustomizableKPIGrid() {
  const { config, loading: configLoading } = useDashboardConfig();
  const { kpis, loading: kpisLoading } = useDashboardKPIs(config.period_filter);

  if (configLoading || kpisLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-white/20 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  const visibleKPIs = config.layout.kpi_order.filter(
    kpiKey => config.kpis[kpiKey as keyof typeof config.kpis]
  );

  if (visibleKPIs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>Nenhum KPI selecionado. Configure o dashboard para visualizar os dados.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {visibleKPIs.map((kpiKey) => {
        const kpiData = kpiConfig[kpiKey as keyof typeof kpiConfig];
        const value = kpis[kpiKey as keyof typeof kpis];
        
        return (
          <KPICard
            key={kpiKey}
            title={kpiData.title}
            value={kpiData.format(value)}
            trend={kpiData.trend}
            icon={kpiData.icon}
          />
        );
      })}
    </div>
  );
}
