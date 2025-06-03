
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import ChartsSection from "./ChartsSection";
import FunnelChart from "./charts/FunnelChart";
import PerformanceChart from "./charts/PerformanceChart";
import TagsChart from "./charts/TagsChart";

const chartComponents = {
  funil_conversao: FunnelChart,
  performance_vendedores: PerformanceChart,
  evolucao_temporal: ChartsSection,
  leads_etiquetas: TagsChart
};

export default function CustomizableChartsSection() {
  const { config, loading } = useDashboardConfig();

  console.log("CustomizableChartsSection - Current config:", config);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-96 bg-white/20 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  const visibleCharts = config.layout.chart_order.filter(
    chartKey => config.charts[chartKey as keyof typeof config.charts]
  );

  console.log("Visible Charts:", visibleCharts);

  if (visibleCharts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>Nenhum gráfico selecionado. Configure o dashboard para visualizar os gráficos.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {visibleCharts.map((chartKey) => {
        const ChartComponent = chartComponents[chartKey as keyof typeof chartComponents];
        
        if (!ChartComponent) {
          console.error(`Component not found for chart key: ${chartKey}`);
          return null;
        }
        
        return <ChartComponent key={chartKey} />;
      })}
    </div>
  );
}
