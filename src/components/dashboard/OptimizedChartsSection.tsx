
import { useMemo } from "react";
import { useOptimizedDashboardConfig } from "@/hooks/dashboard/useOptimizedDashboardConfig";
import ChartsSection from "./ChartsSection";
import FunnelChart from "./charts/FunnelChart";
import PerformanceChart from "./charts/PerformanceChart";
import TagsChart from "./charts/TagsChart";
import DistributionChart from "./charts/DistributionChart";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const chartComponents = {
  funil_conversao: FunnelChart,
  performance_vendedores: PerformanceChart,
  evolucao_temporal: ChartsSection,
  leads_etiquetas: TagsChart,
  distribuicao_fonte: DistributionChart
};

export default function OptimizedChartsSection() {
  const { config, loading } = useOptimizedDashboardConfig();

  // Memoizar gráficos visíveis
  const visibleCharts = useMemo(() => {
    if (!config?.layout?.chart_order || !config.charts) {
      console.log("OptimizedChartsSection - usando gráficos padrão");
      return ['funil_conversao', 'performance_vendedores'];
    }

    const filtered = config.layout.chart_order.filter(chartKey => {
      if (typeof chartKey !== 'string') return false;
      return config.charts[chartKey as keyof typeof config.charts];
    });

    return filtered.length === 0 ? ['funil_conversao', 'performance_vendedores'] : filtered;
  }, [config]);

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

  const getGridCols = (count: number) => {
    if (count === 1) return "grid-cols-1 max-w-4xl mx-auto";
    return "grid-cols-1 lg:grid-cols-2";
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="text-center py-8 text-gray-600">
          <p>Erro ao carregar gráficos. Tente recarregar a página.</p>
        </div>
      }
    >
      <div className={`grid ${getGridCols(visibleCharts.length)} gap-6`}>
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
          
          return (
            <ErrorBoundary
              key={chartKey}
              fallback={
                <div className="rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl p-6">
                  <p className="text-gray-600">Erro ao carregar gráfico</p>
                </div>
              }
            >
              <ChartComponent />
            </ErrorBoundary>
          );
        })}
      </div>
    </ErrorBoundary>
  );
}
