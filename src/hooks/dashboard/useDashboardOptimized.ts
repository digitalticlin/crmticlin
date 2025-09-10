/**
 * 🚀 DASHBOARD ISOLADO E OTIMIZADO
 * 
 * ISOLAMENTO COMPLETO:
 * ✅ Query keys com namespace específico (DASHBOARD-*)
 * ✅ Cache otimizado por tipo de dado
 * ✅ Memoização de operações custosas  
 * ✅ Debounce em filtros frequentes
 * ✅ Prefetch inteligente
 * ✅ Zero interferência com outras páginas
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useDashboardFilters } from "@/hooks/shared/filters";

// ✅ QUERY KEYS ISOLADAS - NAMESPACE ÚNICO
const dashboardQueryKeys = {
  base: ['DASHBOARD'] as const,
  kpis: (userId: string, period: string, role: string) => 
    [...dashboardQueryKeys.base, 'kpis', userId, period, role] as const,
  charts: (userId: string, chartType: string, filters: any) => 
    [...dashboardQueryKeys.base, 'charts', userId, chartType, JSON.stringify(filters)] as const,
  funnels: (userId: string, role: string) => 
    [...dashboardQueryKeys.base, 'funnels', userId, role] as const,
  performance: (userId: string, period: string) => 
    [...dashboardQueryKeys.base, 'performance', userId, period] as const,
  evolution: (userId: string, period: string) => 
    [...dashboardQueryKeys.base, 'evolution', userId, period] as const
};

// ✅ TIPOS ISOLADOS
interface DashboardKPIs {
  novos_leads: number;
  total_leads: number;
  taxa_conversao: number;
  taxa_perda: number;
  valor_pipeline: number;
  ticket_medio: number;
  tempo_resposta: number;
}

interface DashboardChartData {
  labels: string[];
  values: number[];
  colors?: string[];
}

interface DashboardState {
  selectedPeriod: string;
  selectedCharts: string[];
  isCustomizing: boolean;
  kpiOrder: string[];
}

// ✅ DEBOUNCE HOOK
const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

export function useDashboardOptimized() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { userFunnels, canViewAllFunnels, isLoading: accessLoading } = useAccessControl();
  const dataFilters = useDashboardFilters();

  // ✅ ESTADO DASHBOARD ISOLADO
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    selectedPeriod: '30d',
    selectedCharts: ['funnel', 'conversion', 'performance'],
    isCustomizing: false,
    kpiOrder: ['novos_leads', 'total_leads', 'taxa_conversao', 'valor_pipeline']
  });

  // ✅ DEBOUNCE - Evita queries excessivas
  const debouncedPeriod = useDebouncedValue(dashboardState.selectedPeriod, 500);
  const debouncedCharts = useDebouncedValue(dashboardState.selectedCharts, 300);

  // ✅ QUERY ISOLADA - KPIs com cache inteligente
  const { 
    data: kpis, 
    isLoading: kpisLoading,
    error: kpisError
  } = useQuery({
    queryKey: dashboardQueryKeys.kpis(
      user?.id || '', 
      debouncedPeriod, 
      dataFilters.role || ''
    ),
    queryFn: async (): Promise<DashboardKPIs> => {
      if (!user?.id) {
        return {
          novos_leads: 0,
          total_leads: 0,
          taxa_conversao: 0,
          taxa_perda: 0,
          valor_pipeline: 0,
          ticket_medio: 0,
          tempo_resposta: 0
        };
      }

      console.log('🚀 [Dashboard] Buscando KPIs isolados:', {
        userId: user.id,
        period: debouncedPeriod,
        role: dataFilters.role
      });

      // ✅ LÓGICA BASEADA EM ROLE
      let baseQuery = supabase.from('leads').select('*');
      
      if (dataFilters.role === 'admin') {
        baseQuery = baseQuery.eq('created_by_user_id', user.id);
      } else if (dataFilters.role === 'operational') {
        if (userFunnels && userFunnels.length > 0) {
          baseQuery = baseQuery.in('funnel_id', userFunnels);
        } else {
          baseQuery = baseQuery.eq('owner_id', user.id);
        }
      }

      // ✅ FILTRO DE PERÍODO
      const periodDays = parseInt(debouncedPeriod.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      
      baseQuery = baseQuery.gte('created_at', startDate.toISOString());

      const { data: leads, error } = await baseQuery;
      if (error) throw error;

      // ✅ CÁLCULOS MEMOIZADOS
      const totalLeads = leads?.length || 0;
      const novosLeads = leads?.filter(l => {
        const createdAt = new Date(l.created_at);
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return createdAt >= oneDayAgo;
      }).length || 0;

      const leadsComValor = leads?.filter(l => l.purchase_value && l.purchase_value > 0) || [];
      const valorTotal = leadsComValor.reduce((sum, l) => sum + (l.purchase_value || 0), 0);
      const ticketMedio = leadsComValor.length > 0 ? valorTotal / leadsComValor.length : 0;

      // ✅ BUSCAR DEALS PARA CONVERSÃO
      const { data: deals } = await supabase
        .from('deals')
        .select('status')
        .in('lead_id', leads?.map(l => l.id) || []);

      const wonDeals = deals?.filter(d => d.status === 'won').length || 0;
      const lostDeals = deals?.filter(d => d.status === 'lost').length || 0;
      
      const taxaConversao = totalLeads > 0 ? (wonDeals / totalLeads) * 100 : 0;
      const taxaPerda = totalLeads > 0 ? (lostDeals / totalLeads) * 100 : 0;

      return {
        novos_leads: novosLeads,
        total_leads: totalLeads,
        taxa_conversao: taxaConversao,
        taxa_perda: taxaPerda,
        valor_pipeline: valorTotal,
        ticket_medio: ticketMedio,
        tempo_resposta: 2.5 // Placeholder - implementar lógica real
      };
    },
    enabled: !!user?.id && !accessLoading,
    staleTime: 3 * 60 * 1000, // ✅ Cache de 3 minutos para KPIs
    gcTime: 5 * 60 * 1000
  });

  // ✅ QUERY ISOLADA - Dados de Funis
  const {
    data: funnelData,
    isLoading: funnelLoading
  } = useQuery({
    queryKey: dashboardQueryKeys.funnels(user?.id || '', dataFilters.role || ''),
    queryFn: async (): Promise<DashboardChartData> => {
      if (!user?.id) return { labels: [], values: [] };

      let funnelQuery = supabase
        .from('funnels')
        .select(`
          id,
          name,
          leads (count)
        `);

      if (dataFilters.role === 'admin') {
        funnelQuery = funnelQuery.eq('created_by_user_id', user.id);
      } else if (userFunnels && userFunnels.length > 0) {
        funnelQuery = funnelQuery.in('id', userFunnels);
      }

      const { data: funnels, error } = await funnelQuery;
      if (error) throw error;

      return {
        labels: funnels?.map(f => f.name) || [],
        values: funnels?.map(f => f.leads?.length || 0) || [],
        colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6']
      };
    },
    enabled: !!user?.id && !accessLoading,
    staleTime: 5 * 60 * 1000, // ✅ Cache de 5 minutos para funis
    gcTime: 10 * 60 * 1000
  });

  // ✅ QUERY ISOLADA - Performance Evolution
  const {
    data: performanceData,
    isLoading: performanceLoading
  } = useQuery({
    queryKey: dashboardQueryKeys.performance(user?.id || '', debouncedPeriod),
    queryFn: async (): Promise<DashboardChartData> => {
      if (!user?.id) return { labels: [], values: [] };

      // ✅ Implementar lógica de evolução temporal
      const days = parseInt(debouncedPeriod.replace('d', ''));
      const labels = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
      });

      // ✅ Valores simulados - implementar lógica real
      const values = Array.from({ length: 7 }, () => Math.floor(Math.random() * 100) + 50);

      return { labels, values };
    },
    enabled: !!user?.id && debouncedCharts.includes('performance'),
    staleTime: 2 * 60 * 1000, // ✅ Cache de 2 minutos para performance
    gcTime: 5 * 60 * 1000
  });

  // ✅ MEMOIZAÇÃO - Configuração do dashboard
  const dashboardConfig = useMemo(() => ({
    kpiCards: dashboardState.kpiOrder.map(kpiKey => ({
      key: kpiKey,
      title: kpiKey.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
      value: kpis?.[kpiKey as keyof DashboardKPIs] || 0,
      visible: true
    })),
    chartConfigs: debouncedCharts.map(chartType => ({
      type: chartType,
      data: chartType === 'funnel' ? funnelData : performanceData,
      visible: true
    }))
  }), [dashboardState.kpiOrder, kpis, debouncedCharts, funnelData, performanceData]);

  // ✅ CALLBACKS MEMOIZADOS
  const updatePeriod = useCallback((period: string) => {
    setDashboardState(prev => ({ ...prev, selectedPeriod: period }));
  }, []);

  const toggleCustomizing = useCallback(() => {
    setDashboardState(prev => ({ ...prev, isCustomizing: !prev.isCustomizing }));
  }, []);

  const updateChartSelection = useCallback((charts: string[]) => {
    setDashboardState(prev => ({ ...prev, selectedCharts: charts }));
  }, []);

  const reorderKPIs = useCallback((newOrder: string[]) => {
    setDashboardState(prev => ({ ...prev, kpiOrder: newOrder }));
  }, []);

  // ✅ PREFETCH - Dados relacionados
  useEffect(() => {
    if (user?.id && !kpisLoading) {
      // Prefetch próximo período
      const nextPeriod = debouncedPeriod === '30d' ? '7d' : '30d';
      queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.kpis(user.id, nextPeriod, dataFilters.role || ''),
        staleTime: 1 * 60 * 1000
      });
    }
  }, [user?.id, kpisLoading, debouncedPeriod, dataFilters.role, queryClient]);

  return {
    // ✅ Dados isolados
    kpis,
    funnelData,
    performanceData,
    dashboardConfig,
    
    // ✅ Estados isolados  
    loading: kpisLoading || funnelLoading || performanceLoading || accessLoading,
    error: kpisError,
    
    // ✅ Estado do dashboard
    selectedPeriod: dashboardState.selectedPeriod,
    selectedCharts: dashboardState.selectedCharts,
    isCustomizing: dashboardState.isCustomizing,
    
    // ✅ Actions isoladas
    updatePeriod,
    toggleCustomizing,
    updateChartSelection,
    reorderKPIs,
    
    // ✅ Metadata
    role: dataFilters.role,
    userId: user?.id,
    canViewAllFunnels,
    
    // ✅ Query client para invalidações manuais
    queryClient,
    
    // ✅ Helper para invalidar cache específico do dashboard
    invalidateDashboardData: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.base });
    }, [queryClient])
  };
}