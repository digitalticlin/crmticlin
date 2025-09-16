/**
 * 🔒 QUERIES ISOLADAS - PÁGINA DASHBOARD
 * Todas as queries com proteção multi-tenant OBRIGATÓRIA
 * CRÍTICO: Sempre usar buildSecureDashboardQuery para garantir isolamento
 */

import { useQuery } from "@tanstack/react-query";
import { 
  useDashboardPageFilters, 
  buildSecureDashboardQuery,
  validateDashboardDataAccess 
} from "./datafilters";

/**
 * 🔒 QUERY KPIs - Métricas principais com multi-tenant
 */
export const useDashboardKPIs = () => {
  const filters = useDashboardPageFilters();
  
  return useQuery({
    queryKey: ["dashboard-kpis", filters.userId, filters.role, filters.createdByUserId, filters.period],
    queryFn: async () => {
      if (!filters.userId || !filters.role || filters.loading) {
        console.log('[Dashboard KPIs] ⚠️ Bloqueado: usuário não autenticado');
        return null;
      }
      
      console.log('[Dashboard KPIs] 🔒 Buscando métricas com proteção multi-tenant');
      
      // 🔒 QUERIES COM FILTRO OBRIGATÓRIO
      const leadsQuery = buildSecureDashboardQuery('leads', filters);
      const dealsQuery = buildSecureDashboardQuery('deals', filters);
      const tasksQuery = buildSecureDashboardQuery('tasks', filters);
      
      // Buscar dados em paralelo
      const [leadsResult, dealsResult, tasksResult] = await Promise.all([
        leadsQuery.select('*', { count: 'exact' }),
        dealsQuery.select('value, status', { count: 'exact' }),
        tasksQuery.select('status, completed_at', { count: 'exact' })
      ]);
      
      // Validar acesso adicional (dupla verificação)
      const validLeads = (leadsResult.data || []).filter(lead => 
        validateDashboardDataAccess(lead, filters)
      );
      
      const validDeals = (dealsResult.data || []).filter(deal => 
        validateDashboardDataAccess(deal, filters)
      );
      
      // Calcular métricas
      const totalLeads = validLeads.length;
      const totalRevenue = validDeals
        .filter(d => d.status === 'won')
        .reduce((sum, d) => sum + (d.value || 0), 0);
      
      const conversionRate = totalLeads > 0 
        ? (validDeals.filter(d => d.status === 'won').length / totalLeads) * 100
        : 0;
      
      const tasksCompleted = (tasksResult.data || [])
        .filter(t => t.status === 'completed').length;
      
      console.log('[Dashboard KPIs] ✅ Métricas calculadas com segurança:', {
        totalLeads,
        totalRevenue,
        conversionRate,
        tasksCompleted
      });
      
      return {
        leads: {
          total: totalLeads,
          new: validLeads.filter(l => {
            const created = new Date(l.created_at);
            const dayAgo = new Date();
            dayAgo.setDate(dayAgo.getDate() - 1);
            return created > dayAgo;
          }).length,
          trend: 0 // TODO: Calcular tendência
        },
        revenue: {
          total: totalRevenue,
          currency: 'BRL',
          trend: 0
        },
        conversion: {
          rate: conversionRate,
          total: validDeals.filter(d => d.status === 'won').length,
          trend: 0
        },
        performance: {
          tasksCompleted,
          efficiency: tasksCompleted > 0 ? 85 : 0, // Placeholder
          trend: 0
        }
      };
    },
    enabled: !!filters.userId && !filters.loading && !!filters.role,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: 1000 * 60 * 5 // Auto-refresh a cada 5 minutos
  });
};

/**
 * 🔒 QUERY GRÁFICO DE RECEITA - Com isolamento por tenant
 */
export const useDashboardRevenueChart = () => {
  const filters = useDashboardPageFilters();
  
  return useQuery({
    queryKey: ["dashboard-revenue-chart", filters.userId, filters.role, filters.period],
    queryFn: async () => {
      if (!filters.userId || !filters.role) return null;
      
      // 🔒 Query segura com filtros
      const query = buildSecureDashboardQuery('deals', filters)
        .select('value, created_at, status')
        .eq('status', 'won')
        .order('created_at', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[Revenue Chart] Erro:', error);
        return null;
      }
      
      // Validar acesso e agrupar por período
      const validData = (data || []).filter(deal => 
        validateDashboardDataAccess(deal, filters)
      );
      
      // Agrupar dados por dia/semana/mês conforme filtro
      const grouped = groupDataByPeriod(validData, filters.groupBy || 'day');
      
      return {
        labels: grouped.labels,
        datasets: [{
          label: 'Receita',
          data: grouped.values,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)'
        }]
      };
    },
    enabled: !!filters.userId && !filters.loading && filters.enabledCharts.includes('revenue'),
    staleTime: 1000 * 60 * 10 // 10 minutos
  });
};

/**
 * 🔒 QUERY GRÁFICO DE CONVERSÃO - Com proteção multi-tenant
 */
export const useDashboardConversionChart = () => {
  const filters = useDashboardPageFilters();
  
  return useQuery({
    queryKey: ["dashboard-conversion-chart", filters.userId, filters.role, filters.period],
    queryFn: async () => {
      if (!filters.userId || !filters.role) return null;
      
      // 🔒 Buscar leads e deals com filtros
      const leadsQuery = buildSecureDashboardQuery('leads', filters)
        .select('id, created_at, kanban_stage_id');
      
      const dealsQuery = buildSecureDashboardQuery('deals', filters)
        .select('lead_id, status, created_at');
      
      const [leadsResult, dealsResult] = await Promise.all([
        leadsQuery,
        dealsQuery
      ]);
      
      // Validar e processar
      const validLeads = (leadsResult.data || []).filter(l => 
        validateDashboardDataAccess(l, filters)
      );
      
      const validDeals = (dealsResult.data || []).filter(d => 
        validateDashboardDataAccess(d, filters)
      );
      
      // Calcular taxa de conversão por período
      const conversionData = calculateConversionByPeriod(
        validLeads, 
        validDeals, 
        filters.groupBy || 'day'
      );
      
      return {
        labels: conversionData.labels,
        datasets: [{
          label: 'Taxa de Conversão (%)',
          data: conversionData.rates,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)'
        }]
      };
    },
    enabled: !!filters.userId && !filters.loading && filters.enabledCharts.includes('conversion'),
    staleTime: 1000 * 60 * 10
  });
};

/**
 * 🔒 QUERY FUNIL DE VENDAS - Com isolamento completo
 */
export const useDashboardFunnelChart = () => {
  const filters = useDashboardPageFilters();
  
  return useQuery({
    queryKey: ["dashboard-funnel-chart", filters.userId, filters.role, filters.selectedFunnels],
    queryFn: async () => {
      if (!filters.userId || !filters.role) return null;
      
      // 🔒 Buscar estágios e leads com proteção
      const stagesQuery = buildSecureDashboardQuery('kanban_stages', filters)
        .select('id, title, order_position, color')
        .order('order_position');
      
      const leadsQuery = buildSecureDashboardQuery('leads', filters)
        .select('kanban_stage_id');
      
      // Aplicar filtro de funis se selecionado
      if (filters.selectedFunnels.length > 0) {
        stagesQuery.in('funnel_id', filters.selectedFunnels);
        leadsQuery.in('funnel_id', filters.selectedFunnels);
      }
      
      const [stagesResult, leadsResult] = await Promise.all([
        stagesQuery,
        leadsQuery
      ]);
      
      // Validar acesso
      const validStages = (stagesResult.data || []).filter(s => 
        validateDashboardDataAccess(s, filters)
      );
      
      const validLeads = (leadsResult.data || []).filter(l => 
        validateDashboardDataAccess(l, filters)
      );
      
      // Contar leads por estágio
      const stageData = validStages.map(stage => {
        const count = validLeads.filter(l => l.kanban_stage_id === stage.id).length;
        return {
          name: stage.title,
          value: count,
          color: stage.color || '#3B82F6'
        };
      });
      
      return {
        stages: stageData,
        total: validLeads.length
      };
    },
    enabled: !!filters.userId && !filters.loading && filters.enabledCharts.includes('funnel'),
    staleTime: 1000 * 60 * 10
  });
};

/**
 * 🔒 QUERY PERFORMANCE POR OWNER - Com validação multi-tenant
 */
export const useDashboardPerformanceByOwner = () => {
  const filters = useDashboardPageFilters();
  
  return useQuery({
    queryKey: ["dashboard-performance-owner", filters.userId, filters.role, filters.teamMembersFilter],
    queryFn: async () => {
      if (!filters.userId || !filters.role) return null;
      
      // Para admin: mostrar performance do time
      // Para operacional: mostrar própria performance
      
      let ownersToAnalyze: string[] = [];
      
      if (filters.role === 'admin' && filters.teamMembersFilter) {
        ownersToAnalyze = [filters.userId, ...filters.teamMembersFilter];
      } else if (filters.role === 'operational') {
        ownersToAnalyze = [filters.userId];
      } else {
        return null;
      }
      
      // 🔒 Buscar dados de performance com filtros
      const performanceData = await Promise.all(
        ownersToAnalyze.map(async (ownerId) => {
          // Buscar leads do owner
          const leadsQuery = buildSecureDashboardQuery('leads', filters)
            .select('id')
            .eq('owner_id', ownerId);
          
          // Buscar deals do owner
          const dealsQuery = buildSecureDashboardQuery('deals', filters)
            .select('value, status')
            .eq('owner_id', ownerId);
          
          // Buscar tasks do owner
          const tasksQuery = buildSecureDashboardQuery('tasks', filters)
            .select('status')
            .eq('assigned_to', ownerId);
          
          const [leads, deals, tasks] = await Promise.all([
            leadsQuery,
            dealsQuery,
            tasksQuery
          ]);
          
          // Buscar nome do owner
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', ownerId)
            .single();
          
          return {
            ownerId,
            name: profile?.full_name || 'Desconhecido',
            totalLeads: leads.data?.length || 0,
            totalRevenue: (deals.data || [])
              .filter(d => d.status === 'won')
              .reduce((sum, d) => sum + (d.value || 0), 0),
            conversionRate: calculateConversionRate(leads.data, deals.data),
            tasksCompleted: (tasks.data || [])
              .filter(t => t.status === 'completed').length
          };
        })
      );
      
      return performanceData;
    },
    enabled: !!filters.userId && !filters.loading && !!filters.role,
    staleTime: 1000 * 60 * 15 // 15 minutos
  });
};

// 🔧 Funções auxiliares

function groupDataByPeriod(data: any[], period: 'day' | 'week' | 'month') {
  const grouped = new Map<string, number>();
  
  data.forEach(item => {
    const date = new Date(item.created_at);
    let key: string;
    
    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }
    
    grouped.set(key, (grouped.get(key) || 0) + (item.value || 0));
  });
  
  const sortedEntries = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  
  return {
    labels: sortedEntries.map(([key]) => key),
    values: sortedEntries.map(([, value]) => value)
  };
}

function calculateConversionByPeriod(leads: any[], deals: any[], period: 'day' | 'week' | 'month') {
  // Implementação simplificada
  const labels: string[] = [];
  const rates: number[] = [];
  
  // TODO: Implementar cálculo real por período
  
  return { labels, rates };
}

function calculateConversionRate(leads: any, deals: any): number {
  if (!leads || leads.length === 0) return 0;
  
  const wonDeals = (deals || []).filter((d: any) => d.status === 'won').length;
  return (wonDeals / leads.length) * 100;
}