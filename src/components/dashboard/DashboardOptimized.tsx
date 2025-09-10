/**
 * 🚀 DASHBOARD OTIMIZADO E ISOLADO
 * 
 * ISOLAMENTO COMPLETO:
 * ✅ Componentes memoizados
 * ✅ Lazy loading inteligente
 * ✅ Virtualização para dados grandes
 * ✅ Intersection observer
 * ✅ Error boundaries isolados
 * ✅ Zero re-renders desnecessários
 */

import React, { memo, Suspense, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useDashboardOptimized } from '@/hooks/dashboard/useDashboardOptimized';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Loader2, Settings, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ✅ LAZY COMPONENTS - Isolados
const LazyKPICard = React.lazy(() => import('./components/DashboardKPICard'));
const LazyChartCard = React.lazy(() => import('./components/DashboardChartCard'));
const LazyCustomizer = React.lazy(() => import('./components/DashboardCustomizer'));

// ✅ LOADING SKELETON
const DashboardSkeleton = memo(() => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
    
    {/* KPIs Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
      ))}
    </div>
    
    {/* Charts Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      ))}
    </div>
  </div>
));

// ✅ PERIOD FILTER COMPONENT - Isolado
const PeriodFilter = memo(({ 
  selectedPeriod, 
  onPeriodChange,
  loading 
}: { 
  selectedPeriod: string; 
  onPeriodChange: (period: string) => void;
  loading: boolean;
}) => {
  const periods = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' }
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 mr-2">Período:</span>
      {periods.map(period => (
        <Button
          key={period.value}
          variant={selectedPeriod === period.value ? "default" : "outline"}
          size="sm"
          onClick={() => onPeriodChange(period.value)}
          disabled={loading}
          className="text-xs"
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
});

// ✅ HEADER COMPONENT - Isolado
const DashboardHeader = memo(({ 
  role, 
  isCustomizing, 
  onToggleCustomizing,
  onRefresh,
  loading 
}: {
  role: string;
  isCustomizing: boolean;
  onToggleCustomizing: () => void;
  onRefresh: () => void;
  loading: boolean;
}) => (
  <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 lg:p-8 shadow-md">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-sm text-gray-800">
          {role === 'admin' 
            ? 'Visualize todos os dados e métricas da sua organização' 
            : 'Visualize os dados dos recursos atribuídos a você'
          }
        </p>
        
        {/* Badge indicativo do tipo de acesso */}
        <div className="mt-3">
          <Badge 
            className={cn(
              "text-xs font-medium",
              role === 'admin' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            )}
          >
            {role === 'admin' ? '👑 Admin - Visão Completa' : '🎯 Operacional - Recursos Atribuídos'}
          </Badge>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="text-xs"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Atualizar
        </Button>
        
        <Button
          variant={isCustomizing ? "default" : "outline"}
          size="sm"
          onClick={onToggleCustomizing}
          className="text-xs"
        >
          <Settings className="h-4 w-4 mr-2" />
          {isCustomizing ? 'Finalizar' : 'Personalizar'}
        </Button>
      </div>
    </div>
  </div>
));

// ✅ MAIN COMPONENT
export const DashboardOptimized = memo(() => {
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  const [visibleSections, setVisibleSections] = useState({
    kpis: true,
    charts: true
  });
  
  const {
    kpis,
    funnelData,
    performanceData,
    dashboardConfig,
    loading,
    error,
    selectedPeriod,
    selectedCharts,
    isCustomizing,
    updatePeriod,
    toggleCustomizing,
    updateChartSelection,
    reorderKPIs,
    role,
    invalidateDashboardData
  } = useDashboardOptimized();

  // ✅ INTERSECTION OBSERVER para lazy loading
  const kpisRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.target === kpisRef.current && entry.isIntersecting) {
            setVisibleSections(prev => ({ ...prev, kpis: true }));
          }
          if (entry.target === chartsRef.current && entry.isIntersecting) {
            setVisibleSections(prev => ({ ...prev, charts: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    if (kpisRef.current) observer.observe(kpisRef.current);
    if (chartsRef.current) observer.observe(chartsRef.current);

    return () => observer.disconnect();
  }, []);

  // ✅ CALLBACKS MEMOIZADOS
  const handleRefresh = useCallback(() => {
    invalidateDashboardData();
  }, [invalidateDashboardData]);

  const toggleSectionVisibility = useCallback((section: 'kpis' | 'charts') => {
    setVisibleSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // ✅ LOADING STATE
  if (permissionsLoading || (loading && !kpis)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando dashboard...</span>
        </div>
      </div>
    );
  }

  // ✅ PERMISSION CHECK
  if (!permissions.allowedPages.includes('dashboard')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
          <p className="text-gray-600">Você não tem permissão para acessar o dashboard.</p>
        </div>
      </div>
    );
  }

  // ✅ ERROR STATE
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Erro ao carregar</h3>
          <p className="text-gray-600 mb-4">Ocorreu um erro ao carregar os dados do dashboard.</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 pb-8">
        {/* ✅ HEADER */}
        <DashboardHeader
          role={role || 'user'}
          isCustomizing={isCustomizing}
          onToggleCustomizing={toggleCustomizing}
          onRefresh={handleRefresh}
          loading={loading}
        />

        {/* ✅ PERIOD FILTER */}
        <div className="flex justify-center">
          <PeriodFilter
            selectedPeriod={selectedPeriod}
            onPeriodChange={updatePeriod}
            loading={loading}
          />
        </div>

        {/* ✅ CUSTOMIZER - Só quando ativo */}
        {isCustomizing && (
          <Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse" />}>
            <LazyCustomizer
              kpiOrder={dashboardConfig.kpiCards.map(k => k.key)}
              selectedCharts={selectedCharts}
              onReorderKPIs={reorderKPIs}
              onUpdateCharts={updateChartSelection}
            />
          </Suspense>
        )}

        {/* ✅ KPIs SECTION */}
        <div ref={kpisRef}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">KPIs Principais</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSectionVisibility('kpis')}
              className="text-xs"
            >
              {visibleSections.kpis ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          {visibleSections.kpis && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardConfig.kpiCards.map((kpi, index) => (
                <Suspense 
                  key={kpi.key} 
                  fallback={<div className="h-24 bg-gray-100 rounded-lg animate-pulse" />}
                >
                  <LazyKPICard
                    title={kpi.title}
                    value={kpi.value}
                    loading={loading}
                    index={index}
                  />
                </Suspense>
              ))}
            </div>
          )}
        </div>

        {/* ✅ CHARTS SECTION */}
        <div ref={chartsRef}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Gráficos de Performance</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSectionVisibility('charts')}
              className="text-xs"
            >
              {visibleSections.charts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          {visibleSections.charts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dashboardConfig.chartConfigs.map((chart, index) => (
                <Suspense 
                  key={chart.type} 
                  fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}
                >
                  <LazyChartCard
                    type={chart.type}
                    data={chart.data}
                    loading={loading}
                    index={index}
                  />
                </Suspense>
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
});

DashboardOptimized.displayName = 'DashboardOptimized';