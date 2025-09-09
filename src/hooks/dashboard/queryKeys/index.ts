/**
 * DASHBOARD - Query Keys - COMPLETAMENTE ISOLADO
 * 
 * Estrutura de isolamento máximo:
 * - Prefixo único: 'dashboard-'
 * - Separado por módulos/seções do dashboard
 * - Zero conflito com Sales Funnel e Chat
 */

// Módulo: KPIs Dashboard
export const dashboardKPIsQueryKeys = {
  base: ['dashboard-kpis'] as const,
  byPeriod: (userId: string, periodFilter: string, userFunnels: string[], canViewAllFunnels: boolean) => [
    ...dashboardKPIsQueryKeys.base,
    'by-period',
    userId,
    periodFilter,
    userFunnels.sort(),
    canViewAllFunnels
  ] as const,
} as const;

// Módulo: Gráficos Dashboard
export const dashboardChartsQueryKeys = {
  base: ['dashboard-charts'] as const,
  funnelData: (userId: string, canViewAllFunnels: boolean, userFunnels: string[]) => [
    ...dashboardChartsQueryKeys.base,
    'funnel-data',
    userId,
    canViewAllFunnels,
    userFunnels.sort()
  ] as const,
  stagesData: (funnelId: string) => [
    ...dashboardChartsQueryKeys.base,
    'stages-data',
    funnelId
  ] as const,
} as const;

// Módulo: Configuração Dashboard
export const dashboardConfigQueryKeys = {
  base: ['dashboard-config'] as const,
  byUser: (userId: string) => [
    ...dashboardConfigQueryKeys.base,
    'by-user',
    userId
  ] as const,
} as const;

// Utilitários de Invalidação - ISOLADOS PARA DASHBOARD
export const dashboardInvalidation = {
  // Invalidar todos os KPIs do dashboard
  allKPIs: () => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'dashboard-kpis'
  }),
  
  // Invalidar todos os gráficos do dashboard
  allCharts: () => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'dashboard-charts'
  }),
  
  // Invalidar configurações do dashboard
  allConfig: () => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'dashboard-config'
  })
} as const;