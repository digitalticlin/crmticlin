
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
  const { config, loading, configVersion } = useDashboardConfig();

  // Criar hash reativo para detectar mudanças
  const chartStateHash = useMemo(() => {
    const enabledCharts = Object.entries(config.charts)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key)
      .sort()
      .join(',');
    return `${configVersion}-${enabledCharts}`;
  }, [config.charts, configVersion]);

  useEffect(() => {
    console.log("📈 CHARTS REACTIVE UPDATE");
    console.log("Hash:", chartStateHash);
    console.log("Enabled Charts:", Object.entries(config.charts).filter(([_, enabled]) => enabled));
  }, [chartStateHash, config.charts]);

  const visibleCharts = useMemo(() => {
    const visible = config.layout.chart_order.filter(
      chartKey => config.charts[chartKey as keyof typeof config.charts]
    );
    console.log("✅ VISIBLE CHARTS:", visible);
    return visible;
  }, [config.layout.chart_order, config.charts, configVersion]);

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
      key={chartStateHash}
      className={`grid ${getGridCols(visibleCharts.length)} gap-6 transition-all duration-300 ease-in-out transform`}
      style={{
        animation: "fade-in 0.3s ease-out"
      }}
    >
      {visibleCharts.map((chartKey, index) => {
        const ChartComponent = chartComponents[chartKey as keyof typeof chartComponents];
        
        if (!ChartComponent) {
          console.error(`❌ Component not found for chart key: ${chartKey}`);
          return (
            <div key={chartKey} className="rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl p-6">
              <p className="text-gray-600">Componente não encontrado para: {chartKey}</p>
            </div>
          );
        }
        
        console.log(`📊 Rendering Chart: ${chartKey}`);
        
        return (
          <div
            key={`${chartKey}-${chartStateHash}`}
            className="animate-fade-in transform transition-all duration-200"
            style={{ 
              animationDelay: `${index * 100}ms`,
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
