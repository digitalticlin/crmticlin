
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import MaintenanceChart from "./charts/MaintenanceChart";
import { useMemo, useEffect } from "react";

const chartComponents = {
  funil_conversao: (props: any) => (
    <MaintenanceChart 
      title="Funil de Conversão" 
      description="Análise do funil de vendas por etapa"
      {...props}
    />
  ),
  performance_vendedores: (props: any) => (
    <MaintenanceChart 
      title="Performance por Vendedor" 
      description="Análise de performance individual dos vendedores"
      {...props}
    />
  ),
  evolucao_temporal: (props: any) => (
    <MaintenanceChart 
      title="Evolução Temporal" 
      description="Evolução de métricas ao longo do tempo"
      {...props}
    />
  ),
  leads_etiquetas: (props: any) => (
    <MaintenanceChart 
      title="Leads por Etiquetas" 
      description="Distribuição de leads por categorias e tags"
      {...props}
    />
  ),
  distribuicao_fonte: (props: any) => (
    <MaintenanceChart 
      title="Distribuição por Fonte" 
      description="Análise das origens dos leads captados"
      {...props}
    />
  )
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

  // Sempre 2 cards por linha (mobile: 1 por linha)
  const getGridCols = (_count: number) => "grid-cols-1 lg:grid-cols-2";

  return (
    <div 
      className={`grid ${getGridCols(visibleCharts.length)} gap-6 transition-all duration-100 ease-out w-full`}
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
        
        // Evitar remontagem completa do card: key estável por chart
        const reactiveKey = `chart-${chartKey}`;
        
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
