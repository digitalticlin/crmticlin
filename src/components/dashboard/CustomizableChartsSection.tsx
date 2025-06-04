
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import ChartsSection from "./ChartsSection";
import FunnelChart from "./charts/FunnelChart";
import PerformanceChart from "./charts/PerformanceChart";
import TagsChart from "./charts/TagsChart";
import DistributionChart from "./charts/DistributionChart";
import { useMemo, useEffect, useLayoutEffect } from "react";

const chartComponents = {
  funil_conversao: FunnelChart,
  performance_vendedores: PerformanceChart,
  evolucao_temporal: ChartsSection,
  leads_etiquetas: TagsChart,
  distribuicao_fonte: DistributionChart
};

export default function CustomizableChartsSection() {
  const { config, loading, forceUpdate, getCurrentState } = useDashboardConfig();

  // ETAPA 3: useMemo otimizado com dependências sincronizadas
  const visibleCharts = useMemo(() => {
    // ETAPA 4: Usar estado otimista se disponível
    const currentState = getCurrentState ? getCurrentState() : { charts: config.charts };
    
    const visible = config.layout.chart_order.filter(
      chartKey => currentState.charts[chartKey as keyof typeof currentState.charts]
    );
    
    const timestamp = Date.now();
    console.log(`✅ CHARTS VISIBLE RECALCULATED [${timestamp}]:`, {
      visible,
      forceUpdate,
      configCharts: config.charts,
      optimisticCharts: currentState.charts
    });
    return visible;
  }, [config.layout.chart_order, config.charts, forceUpdate, getCurrentState]);

  // ETAPA 2: useLayoutEffect para sincronização DOM imediata
  useLayoutEffect(() => {
    const timestamp = Date.now();
    console.log(`📈 CHARTS LAYOUT EFFECT [${timestamp}]:`, {
      forceUpdate,
      visibleCharts,
      configCharts: config.charts
    });
  }, [forceUpdate, visibleCharts, config.charts]);

  // ETAPA 5: Debug temporal - tracking do fluxo
  useEffect(() => {
    const timestamp = Date.now();
    console.log(`📈 CHARTS UPDATE [${timestamp}]:`, {
      forceUpdate,
      visibleCharts,
      configCharts: config.charts
    });
  }, [forceUpdate, visibleCharts, config.charts]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-96 bg-white/20 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (visibleCharts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 animate-fade-in">
        <p>Nenhum gráfico selecionado. Configure o dashboard para visualizar os gráficos.</p>
      </div>
    );
  }

  const getGridCols = (count: number) => {
    if (count === 1) return "grid-cols-1 max-w-4xl mx-auto";
    if (count === 2) return "grid-cols-1 lg:grid-cols-2";
    if (count === 3) return "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3";
    return "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";
  };

  return (
    <div 
      className={`grid ${getGridCols(visibleCharts.length)} gap-6 transition-all duration-150 ease-out transform`}
      style={{
        animation: "fade-in 0.15s ease-out"
      }}
    >
      {visibleCharts.map((chartKey, index) => {
        const ChartComponent = chartComponents[chartKey as keyof typeof chartComponents];
        
        // ETAPA 4: Usar estado otimista para isEnabled
        const currentState = getCurrentState ? getCurrentState() : { charts: config.charts };
        const isEnabled = currentState.charts[chartKey as keyof typeof currentState.charts];
        
        if (!ChartComponent) {
          console.error(`❌ Component not found for chart key: ${chartKey}`);
          return (
            <div key={chartKey} className="rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl p-6">
              <p className="text-gray-600">Componente não encontrado para: {chartKey}</p>
            </div>
          );
        }
        
        const timestamp = Date.now();
        console.log(`📊 Rendering Chart [${timestamp}]: ${chartKey} enabled:${isEnabled}`);
        
        // ETAPA 3: Key com timestamp para forçar re-render
        const reactiveKey = `chart-${chartKey}-${forceUpdate}-${isEnabled}-${timestamp}`;
        
        return (
          <div
            key={reactiveKey}
            className="animate-fade-in transform transition-all duration-150"
            style={{ 
              animationDelay: `${index * 50}ms`,
              transform: "scale(1)"
            }}
          >
            <ChartComponent />
          </div>
        );
      })}
    </div>
  );
}
