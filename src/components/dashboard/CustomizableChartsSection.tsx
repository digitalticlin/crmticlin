
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import ChartsSection from "./ChartsSection";
import FunnelChart from "./charts/FunnelChart";
import PerformanceChart from "./charts/PerformanceChart";
import TagsChart from "./charts/TagsChart";
import ChartCard from "./ChartCard";

const chartComponents = {
  funil_conversao: FunnelChart,
  performance_vendedores: PerformanceChart,
  evolucao_temporal: () => <ChartsSection />, // Mantém o gráfico existente
  distribuicao_fonte: () => (
    <ChartCard title="Distribuição por Fonte" description="Em desenvolvimento">
      <div className="h-80 flex items-center justify-center text-gray-500">
        Gráfico de distribuição por fonte será implementado em breve
      </div>
    </ChartCard>
  ),
  leads_etiquetas: TagsChart
};

export default function CustomizableChartsSection() {
  const { config, loading } = useDashboardConfig();

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

  if (visibleCharts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>Nenhum gráfico selecionado. Configure o dashboard para visualizar os gráficos.</p>
      </div>
    );
  }

  // Se o evolucao_temporal for o único selecionado, mantém o layout original
  if (visibleCharts.length === 1 && visibleCharts[0] === 'evolucao_temporal') {
    return <ChartsSection />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {visibleCharts.map((chartKey) => {
        const ChartComponent = chartComponents[chartKey as keyof typeof chartComponents];
        return <ChartComponent key={chartKey} />;
      })}
    </div>
  );
}
