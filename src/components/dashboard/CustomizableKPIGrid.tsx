
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import { useDashboardKPIs } from "@/hooks/dashboard/useDashboardKPIs";
import KPICard from "./KPICard";
import { useMemo, useEffect } from "react";

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
  const { config, loading: configLoading, forceUpdate, getCurrentState } = useDashboardConfig();
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs(config.period_filter);

  // ETAPA 3: useMemo otimizado - dependências simplificadas
  const visibleKPIs = useMemo(() => {
    // ETAPA 1: Usar estado otimista sempre atualizado
    const currentState = getCurrentState();
    
    const visible = config.layout.kpi_order.filter(
      kpiKey => currentState.kpis[kpiKey as keyof typeof currentState.kpis]
    );
    
    const timestamp = Date.now();
    console.log(`✅ KPI VISIBLE INSTANT [${timestamp}]:`, {
      visible,
      forceUpdate,
      lastUpdate: currentState.lastUpdate
    });
    return visible;
  }, [config.layout.kpi_order, forceUpdate, getCurrentState]);

  // ETAPA 5: Debug tracking otimizado
  useEffect(() => {
    const timestamp = Date.now();
    console.log(`🎯 KPI GRID UPDATED [${timestamp}]:`, {
      forceUpdate,
      visibleCount: visibleKPIs.length,
      visibleKPIs
    });
  }, [forceUpdate, visibleKPIs]);

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
      <div className="text-center py-8 text-gray-600 animate-fade-in">
        <p>Nenhum KPI selecionado. Configure o dashboard para visualizar os dados.</p>
      </div>
    );
  }

  const getGridCols = (count: number) => {
    if (count === 1) return "grid-cols-1 max-w-sm mx-auto";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto";
    if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    if (count <= 4) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
    if (count <= 6) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";
  };

  return (
    <div 
      className={`grid ${getGridCols(visibleKPIs.length)} gap-4 md:gap-6 transition-all duration-100 ease-out`}
      style={{
        animation: "fade-in 0.1s ease-out"
      }}
    >
      {visibleKPIs.map((kpiKey, index) => {
        const kpiData = kpiConfig[kpiKey as keyof typeof kpiConfig];
        const value = kpis[kpiKey as keyof typeof kpis];
        
        // ETAPA 1: Usar estado otimista para feedback instantâneo
        const currentState = getCurrentState();
        const isEnabled = currentState.kpis[kpiKey as keyof typeof currentState.kpis];
        
        if (!kpiData) {
          console.warn(`❌ KPI config not found for key: ${kpiKey}`);
          return null;
        }
        
        // ETAPA 3: Key simplificada baseada apenas no forceUpdate
        const reactiveKey = `kpi-${kpiKey}-${forceUpdate}`;
        
        return (
          <div
            key={reactiveKey}
            className="animate-fade-in transform transition-all duration-100"
            style={{ 
              animationDelay: `${index * 20}ms`,
              transform: "scale(1)"
            }}
          >
            <KPICard
              title={kpiData.title}
              value={kpiData.format(value)}
              trend={kpiData.trend}
              icon={kpiData.icon}
            />
          </div>
        );
      })}
    </div>
  );
}
