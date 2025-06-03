
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import ChartsSection from "./ChartsSection";
import FunnelChart from "./charts/FunnelChart";
import PerformanceChart from "./charts/PerformanceChart";
import TagsChart from "./charts/TagsChart";
import DistributionChart from "./charts/DistributionChart";
import { useEffect, useMemo } from "react";

const chartComponents = {
  funil_conversao: FunnelChart,
  performance_vendedores: PerformanceChart,
  evolucao_temporal: ChartsSection,
  leads_etiquetas: TagsChart,
  distribuicao_fonte: DistributionChart
};

export default function CustomizableChartsSection() {
  const { config, loading, refreshKey } = useDashboardConfig();

  // Force re-calculation when refreshKey changes
  const visibleCharts = useMemo(() => {
    console.log("=== CHARTS SECTION RECALCULATING ===");
    console.log("RefreshKey:", refreshKey);
    console.log("Config Charts:", config.charts);
    console.log("Chart Order:", config.layout.chart_order);
    
    const filtered = config.layout.chart_order.filter(chartKey => {
      const isEnabled = config.charts[chartKey as keyof typeof config.charts];
      console.log(`Chart ${chartKey}: ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
      return isEnabled;
    });
    
    console.log("Final visible Charts:", filtered);
    return filtered;
  }, [config, refreshKey]);

  useEffect(() => {
    console.log("=== CHARTS SECTION RE-RENDER ===");
    console.log("RefreshKey:", refreshKey);
    console.log("Visible Charts:", visibleCharts);
  }, [refreshKey, visibleCharts]);

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
      <div className="text-center py-8 text-gray-600">
        <p>Nenhum gráfico selecionado. Configure o dashboard para visualizar os gráficos.</p>
      </div>
    );
  }

  // Grid dinâmico baseado no número de charts
  const getGridCols = (count: number) => {
    if (count === 1) return "grid-cols-1 max-w-4xl mx-auto";
    if (count === 2) return "grid-cols-1 lg:grid-cols-2";
    if (count === 3) return "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3";
    return "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";
  };

  return (
    <div key={`charts-section-${refreshKey}`} className={`grid ${getGridCols(visibleCharts.length)} gap-6`}>
      {visibleCharts.map((chartKey) => {
        const ChartComponent = chartComponents[chartKey as keyof typeof chartComponents];
        
        if (!ChartComponent) {
          console.error(`Component not found for chart key: ${chartKey}`);
          return (
            <div key={chartKey} className="rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl p-6">
              <p className="text-gray-600">Componente não encontrado para: {chartKey}</p>
            </div>
          );
        }
        
        console.log(`Rendering Chart: ${chartKey}`);
        
        return <ChartComponent key={`${chartKey}-${refreshKey}`} />;
      })}
    </div>
  );
}
