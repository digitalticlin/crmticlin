
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import { useDashboardKPIs } from "@/hooks/dashboard/useDashboardKPIs";
import KPICard from "./KPICard";
import { useEffect, useMemo, useState } from "react";

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

export function CustomizableKPIGrid() {
  const { config, loading: configLoading } = useDashboardConfig();
  const { kpis, loading: kpisLoading } = useDashboardKPIs(config.period_filter);
  const [renderKey, setRenderKey] = useState(0);

  // Force re-render when config changes
  useEffect(() => {
    console.log("=== KPI GRID CONFIG CHANGED ===");
    console.log("Config KPIs:", config.kpis);
    console.log("KPI Order:", config.layout.kpi_order);
    setRenderKey(prev => prev + 1);
  }, [config]);

  const visibleKPIs = useMemo(() => {
    console.log("=== KPI GRID CALCULATING VISIBLE KPIS ===");
    console.log("Render Key:", renderKey);
    console.log("Config KPIs:", config.kpis);
    console.log("KPI Order:", config.layout.kpi_order);
    
    const filtered = config.layout.kpi_order.filter(kpiKey => {
      const isEnabled = config.kpis[kpiKey as keyof typeof config.kpis];
      console.log(`KPI ${kpiKey}: ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
      return isEnabled;
    });
    
    console.log("Final visible KPIs:", filtered);
    return filtered;
  }, [config.kpis, config.layout.kpi_order, renderKey]);

  useEffect(() => {
    console.log("=== KPI GRID RE-RENDER ===");
    console.log("Render Key:", renderKey);
    console.log("Visible KPIs:", visibleKPIs);
  }, [renderKey, visibleKPIs]);

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
    <div key={`kpi-grid-${renderKey}`} className={`grid ${getGridCols(visibleKPIs.length)} gap-4 md:gap-6`}>
      {visibleKPIs.map((kpiKey) => {
        const kpiData = kpiConfig[kpiKey as keyof typeof kpiConfig];
        const value = kpis[kpiKey as keyof typeof kpis];
        const trend = kpis.trends[kpiKey as keyof typeof kpis.trends];
        
        if (!kpiData) {
          console.warn(`KPI config not found for key: ${kpiKey}`);
          return null;
        }
        
        console.log(`Rendering KPI: ${kpiKey} with value:`, value, 'trend:', trend);
        
        return (
          <KPICard
            key={`${kpiKey}-${renderKey}`}
            title={kpiData.title}
            value={kpiData.format(value)}
            trend={trend}
            icon={kpiData.icon}
          />
        );
      })}
    </div>
  );
}
