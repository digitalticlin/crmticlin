// @ts-nocheck
/**
 * 🚀 CLIENTS OTIMIZADO E ISOLADO
 * 
 * ISOLAMENTO COMPLETO:
 * ✅ Componentes memoizados
 * ✅ Lazy loading inteligente
 * ✅ Virtualização para listas grandes
 * ✅ Intersection observer
 * ✅ Error boundaries isolados
 * ✅ Zero re-renders desnecessários
 */

import React, { memo, Suspense, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useClientsOptimized } from '@/hooks/clients/useClientsOptimized';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Loader2, Settings, RefreshCw, Eye, EyeOff, Users, Grid, Table, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ✅ LAZY COMPONENTS - Isolados
const LazyClientsTable = React.lazy(() => import('./components/ClientsTableOptimized'));
const LazyClientsGrid = React.lazy(() => import('./components/ClientsGridOptimized'));
const LazyClientDetails = React.lazy(() => import('./components/ClientDetailsOptimized'));
const LazyFiltersPanel = React.lazy(() => import('./components/ClientsFiltersOptimized'));
const LazySearchBar = React.lazy(() => import('./components/ClientsSearchOptimized'));

// ✅ LOADING SKELETON
const ClientsSkeleton = memo(() => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
    
    {/* Search Skeleton */}
    <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
    
    {/* Table Skeleton */}
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
      ))}
    </div>
  </div>
));

// ✅ VIEW MODE SELECTOR - Isolado
const ViewModeSelector = memo(({ 
  viewMode, 
  onViewModeChange,
  loading 
}: { 
  viewMode: 'table' | 'grid' | 'kanban';
  onViewModeChange: (mode: 'table' | 'grid' | 'kanban') => void;
  loading: boolean;
}) => {
  const modes = [
    { value: 'table', label: 'Tabela', icon: Table },
    { value: 'grid', label: 'Grade', icon: Grid },
    { value: 'kanban', label: 'Kanban', icon: List }
  ];

  return (
    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md rounded-lg p-1">
      {modes.map(mode => {
        const Icon = mode.icon;
        return (
          <Button
            key={mode.value}
            variant={viewMode === mode.value ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange(mode.value as 'table' | 'grid' | 'kanban')}
            disabled={loading}
            className="text-xs"
          >
            <Icon className="h-4 w-4 mr-2" />
            {mode.label}
          </Button>
        );
      })}
    </div>
  );
});

// ✅ CLIENTS STATS - Isolado
const ClientsStats = memo(({ 
  totalCount, 
  filteredCount, 
  hasActiveFilters,
  loading 
}: {
  totalCount: number;
  filteredCount: number;
  hasActiveFilters: boolean;
  loading: boolean;
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Total de Clientes',
      value: totalCount,
      color: 'bg-blue-500'
    },
    {
      label: hasActiveFilters ? 'Filtrados' : 'Carregados',
      value: filteredCount,
      color: hasActiveFilters ? 'bg-orange-500' : 'bg-green-500'
    },
    {
      label: 'Filtros Ativos',
      value: hasActiveFilters ? 'Sim' : 'Não',
      color: hasActiveFilters ? 'bg-purple-500' : 'bg-gray-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className={cn(
          "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
          "bg-gradient-to-br", stat.color
        )}>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-white/90 capitalize">
              {stat.label}
            </div>
            <div className="text-2xl font-bold text-white">
              {stat.value}
            </div>
            
            {/* Efeito visual */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

// ✅ HEADER COMPONENT - Isolado
const ClientsHeader = memo(({ 
  role, 
  isFiltersOpen, 
  onToggleFilters,
  onRefresh,
  onCreateClient,
  loading 
}: {
  role: string;
  isFiltersOpen: boolean;
  onToggleFilters: () => void;
  onRefresh: () => void;
  onCreateClient: () => void;
  loading: boolean;
}) => (
  <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 lg:p-8 shadow-md">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Clientes</h1>
        <p className="text-sm text-gray-800">
          {role === 'admin' 
            ? 'Gerencie todos os clientes da sua organização' 
            : 'Visualize os clientes dos recursos atribuídos a você'
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
          variant={isFiltersOpen ? "default" : "outline"}
          size="sm"
          onClick={onToggleFilters}
          className="text-xs"
        >
          <Settings className="h-4 w-4 mr-2" />
          {isFiltersOpen ? 'Ocultar Filtros' : 'Filtros'}
        </Button>
        
        <Button
          className="bg-[#d3d800]/80 hover:bg-[#d3d800] text-black border-2 border-[#d3d800] rounded-xl px-6 py-2.5 font-semibold shadow-lg transition-all duration-200 hover:shadow-xl backdrop-blur-sm"
          onClick={onCreateClient}
          disabled={loading}
        >
          <Users className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>
    </div>
  </div>
));

// ✅ MAIN COMPONENT
export const ClientsOptimized = memo(() => {
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState({
    stats: true,
    clients: true
  });
  
  const {
    clients,
    searchQuery,
    viewMode,
    filters,
    hasActiveFilters,
    loading,
    isLoadingMore,
    hasMoreClients,
    totalClientsCount,
    selectedClient,
    isDetailsOpen,
    isCreateMode,
    updateSearchQuery,
    updateFilters,
    clearFilters,
    selectClient,
    toggleCreateMode,
    closeDetails,
    updateViewMode,
    loadMoreClients,
    refetch,
    role,
    invalidateClientsData
  } = useClientsOptimized();

  // ✅ INTERSECTION OBSERVER para lazy loading
  const statsRef = useRef<HTMLDivElement>(null);
  const clientsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.target === statsRef.current && entry.isIntersecting) {
            setVisibleSections(prev => ({ ...prev, stats: true }));
          }
          if (entry.target === clientsRef.current && entry.isIntersecting) {
            setVisibleSections(prev => ({ ...prev, clients: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    if (statsRef.current) observer.observe(statsRef.current);
    if (clientsRef.current) observer.observe(clientsRef.current);

    return () => observer.disconnect();
  }, []);

  // ✅ CALLBACKS MEMOIZADOS
  const handleRefresh = useCallback(() => {
    invalidateClientsData();
    refetch();
  }, [invalidateClientsData, refetch]);

  const toggleFilters = useCallback(() => {
    setIsFiltersOpen(prev => !prev);
  }, []);

  const toggleSectionVisibility = useCallback((section: 'stats' | 'clients') => {
    setVisibleSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // ✅ LOADING STATE
  if (permissionsLoading || (loading && !clients.length)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando clientes...</span>
        </div>
      </div>
    );
  }

  // ✅ PERMISSION CHECK
  if (!permissions.allowedPages.includes('clients')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
          <p className="text-gray-600">Você não tem permissão para acessar a página de clientes.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 pb-8">
        {/* ✅ HEADER */}
        <ClientsHeader
          role={role || 'user'}
          isFiltersOpen={isFiltersOpen}
          onToggleFilters={toggleFilters}
          onRefresh={handleRefresh}
          onCreateClient={toggleCreateMode}
          loading={loading}
        />

        {/* ✅ STATS SECTION */}
        <div ref={statsRef}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Estatísticas</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSectionVisibility('stats')}
              className="text-xs"
            >
              {visibleSections.stats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          {visibleSections.stats && (
            <ClientsStats
              totalCount={totalClientsCount}
              filteredCount={clients.length}
              hasActiveFilters={hasActiveFilters}
              loading={loading}
            />
          )}
        </div>

        {/* ✅ FILTERS PANEL */}
        {isFiltersOpen && (
          <Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse" />}>
            <LazyFiltersPanel
              filters={filters}
              onUpdateFilters={updateFilters}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </Suspense>
        )}

        {/* ✅ SEARCH BAR */}
        <Suspense fallback={<div className="h-12 bg-gray-100 rounded-lg animate-pulse" />}>
          <div className="flex items-center justify-between gap-4">
            <LazySearchBar
              searchQuery={searchQuery}
              onSearchChange={updateSearchQuery}
              totalCount={totalClientsCount}
              filteredCount={clients.length}
            />
            
            <ViewModeSelector
              viewMode={viewMode}
              onViewModeChange={updateViewMode}
              loading={loading}
            />
          </div>
        </Suspense>

        {/* ✅ CLIENTS SECTION */}
        <div ref={clientsRef}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Clientes</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSectionVisibility('clients')}
              className="text-xs"
            >
              {visibleSections.clients ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          {visibleSections.clients && (
            <div className="space-y-4">
              {viewMode === 'table' && (
                <Suspense fallback={<ClientsSkeleton />}>
                  <LazyClientsTable
                    clients={clients}
                    loading={loading}
                    isLoadingMore={isLoadingMore}
                    hasMoreClients={hasMoreClients}
                    onSelectClient={selectClient}
                    onLoadMore={loadMoreClients}
                  />
                </Suspense>
              )}
              
              {viewMode === 'grid' && (
                <Suspense fallback={<ClientsSkeleton />}>
                  <LazyClientsGrid
                    clients={clients}
                    loading={loading}
                    isLoadingMore={isLoadingMore}
                    hasMoreClients={hasMoreClients}
                    onSelectClient={selectClient}
                    onLoadMore={loadMoreClients}
                  />
                </Suspense>
              )}
            </div>
          )}
        </div>

        {/* ✅ CLIENT DETAILS MODAL */}
        <Suspense fallback={null}>
          <LazyClientDetails
            client={selectedClient}
            isOpen={isDetailsOpen}
            isCreateMode={isCreateMode}
            onClose={closeDetails}
            onRefresh={handleRefresh}
          />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
});

ClientsOptimized.displayName = 'ClientsOptimized';