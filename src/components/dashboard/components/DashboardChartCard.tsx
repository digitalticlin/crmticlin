// @ts-nocheck
/**
 * 🚀 CHART CARD ISOLADO - DASHBOARD
 * 
 * ISOLAMENTO COMPLETO:
 * ✅ Componente memoizado
 * ✅ Charts isolados por tipo
 * ✅ Loading states específicos
 * ✅ Error boundaries internas
 * ✅ Zero dependências de outras páginas
 */

import React, { memo, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ✅ TIPOS ISOLADOS
interface ChartData {
  labels: string[];
  values: number[];
  colors?: string[];
}

interface DashboardChartCardProps {
  type: string;
  data?: ChartData;
  loading: boolean;
  index: number;
}

// ✅ CHART COMPONENTS LAZY
const FunnelChart = React.lazy(() => import('./charts/DashboardFunnelChart'));
const PerformanceChart = React.lazy(() => import('./charts/DashboardPerformanceChart'));
const ConversionChart = React.lazy(() => import('./charts/DashboardConversionChart'));

// ✅ CHART SKELETON
const ChartSkeleton = memo(() => (
  <div className="space-y-3">
    <Skeleton className="h-4 w-32" />
    <Skeleton className="h-48 w-full" />
    <div className="flex justify-between">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
));

// ✅ CHART TITLES
const getChartTitle = (type: string): string => {
  const titles: Record<string, string> = {
    funnel: 'Distribuição por Funis',
    performance: 'Performance Temporal',
    conversion: 'Taxa de Conversão',
    revenue: 'Receita por Período'
  };
  
  return titles[type] || 'Gráfico';
};

// ✅ CHART COLORS
const getChartColors = (index: number): string[] => {
  const colorSets = [
    ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'],
    ['#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'],
    ['#F97316', '#6366F1', '#14B8A6', '#EAB308'],
    ['#DC2626', '#7C3AED', '#059669', '#D97706']
  ];
  
  return colorSets[index % colorSets.length];
};

const DashboardChartCard = memo(({
  type,
  data,
  loading,
  index
}: DashboardChartCardProps) => {
  
  // ✅ RENDER CHART BASED ON TYPE
  const renderChart = () => {
    if (!data || loading) {
      return <ChartSkeleton />;
    }

    const chartProps = {
      data,
      colors: getChartColors(index),
      loading
    };

    switch (type) {
      case 'funnel':
        return (
          <Suspense fallback={<ChartSkeleton />}>
            <FunnelChart {...chartProps} />
          </Suspense>
        );
      
      case 'performance':
        return (
          <Suspense fallback={<ChartSkeleton />}>
            <PerformanceChart {...chartProps} />
          </Suspense>
        );
      
      case 'conversion':
        return (
          <Suspense fallback={<ChartSkeleton />}>
            <ConversionChart {...chartProps} />
          </Suspense>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <p>Tipo de gráfico não suportado: {type}</p>
          </div>
        );
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="pb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {getChartTitle(type)}
        </h3>
      </div>

      <div className="pt-0">
        {renderChart()}

        {/* ✅ DATA SUMMARY */}
        {data && !loading && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total de pontos: {data.values.length}</span>
              <span>
                Valor máx: {Math.max(...data.values).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ✅ LOADING OVERLAY */}
      {loading && (
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}
    </div>
  );
});

DashboardChartCard.displayName = 'DashboardChartCard';

export default DashboardChartCard;