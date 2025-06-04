
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import ChartsSection from "./ChartsSection";
import FunnelChart from "./charts/FunnelChart";
import PerformanceChart from "./charts/PerformanceChart";
import TagsChart from "./charts/TagsChart";
import DistributionChart from "./charts/DistributionChart";
import { useMemo, useEffect } from "react";

const chartComponents = {
  funil_conversao: FunnelChart,
  performance_vendedores: PerformanceChart,
  evolucao_temporal: ChartsSection,
  leads_etiquetas: TagsChart,
  distribuicao_fonte: DistributionChart
};

export default function CustomizableChartsSection() {
  const { config, loading, forceUpdate, getCurrentState } = useDashboardConfig();

  // ETAPA 3: useMemo otimizado - dependências simplificadas
  const visibleCharts = useMemo(() => {
    // ETAPA 1: Usar estado otimista sempre atualizado
    const currentState = getCurrentState();
    
    const visible = config.layout.chart_order.filter(
      chartKey => currentState.charts[chartKey as keyof typeof currentState.charts]
    );
    
    const timestamp = Date.now();
    console.log(`✅ CHARTS VISIBLE INSTANT [${timestamp}]:`, {
      visible,
      forceUpdate,
      lastUpdate: currentState.lastUpdate
    });
    return visible;
  }, [config.layout.chart_order, forceUpdate, getCurrentState]);

  // ETAPA 5: Debug tracking otimizado
  useEffect(() => {
    const timestamp = Date.now();
    console.log(`📈 CHARTS UPDATED [${timestamp}]:`, {
      forceUpdate,
      visibleCount: visibleCharts.length,
      visibleCharts
    });
  }, [forceUpdate, visibleCharts]);

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
      className={`grid ${getGridCols(visibleCharts.length)} gap-6 transition-all duration-100 ease-out`}
      style={{
        animation: "fade-in 0.1s ease-out"
      }}
    >
      {visibleCharts.map((chartKey, index) => {
        const ChartComponent = chartComponents[chartKey as keyof typeof chartComponents];
        
        // ETAPA 1: Usar estado otimista para feedback instantâneo
        const currentState = getCurrentState();
        const isEnabled = currentState.charts[chartKey as keyof typeof currentState.charts];
        
        if (!ChartComponent) {
          console.error(`❌ Component not found for chart key: ${chartKey}`);
          return (
            <div key={chartKey} className="rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl p-6">
              <p className="text-gray-600">Componente não encontrado para: {chartKey}</p>
            </div>
          );
        }
        
        // ETAPA 3: Key simplificada baseada apenas no forceUpdate
        const reactiveKey = `chart-${chartKey}-${forceUpdate}`;
        
        return (
          <div
            key={reactiveKey}
            className="animate-fade-in transform transition-all duration-100"
            style={{ 
              animationDelay: `${index * 30}ms`,
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
