/**
 * SALES FUNNEL - Query Keys - COMPLETAMENTE ISOLADO
 * 
 * Estrutura de isolamento máximo:
 * - Prefixo único: 'salesfunnel-'
 * - Separado por módulos/seções
 * - Zero conflito com outras páginas
 */

// Módulo: Funis
export const salesFunnelFunnelsQueryKeys = {
  base: ['salesfunnel-funnels'] as const,
  list: (userId: string, canViewAllFunnels: boolean, userFunnels: string[]) => [
    ...salesFunnelFunnelsQueryKeys.base,
    'list',
    userId, 
    canViewAllFunnels, 
    userFunnels.sort()
  ] as const,
  detail: (funnelId: string) => [
    ...salesFunnelFunnelsQueryKeys.base,
    'detail',
    funnelId
  ] as const,
} as const;

// Módulo: Estágios/Etapas
export const salesFunnelStagesQueryKeys = {
  base: ['salesfunnel-stages'] as const,
  byFunnel: (funnelId: string) => [
    ...salesFunnelStagesQueryKeys.base,
    'by-funnel',
    funnelId
  ] as const,
  detail: (stageId: string) => [
    ...salesFunnelStagesQueryKeys.base,
    'detail',
    stageId
  ] as const,
} as const;

// Módulo: Leads
export const salesFunnelLeadsQueryKeys = {
  base: ['salesfunnel-leads'] as const,
  byFunnel: (funnelId: string, userId: string, canViewAllFunnels: boolean) => [
    ...salesFunnelLeadsQueryKeys.base,
    'by-funnel',
    funnelId, 
    userId, 
    canViewAllFunnels
  ] as const,
  paginated: (funnelId: string, userId: string, canViewAllFunnels: boolean, page: number) => [
    ...salesFunnelLeadsQueryKeys.base,
    'paginated',
    funnelId,
    userId, 
    canViewAllFunnels,
    page
  ] as const,
  detail: (leadId: string) => [
    ...salesFunnelLeadsQueryKeys.base,
    'detail',
    leadId
  ] as const,
} as const;

// Módulo: Tags
export const salesFunnelTagsQueryKeys = {
  base: ['salesfunnel-tags'] as const,
  byUser: (userId: string) => [
    ...salesFunnelTagsQueryKeys.base,
    'by-user',
    userId
  ] as const,
  leadTags: (leadId: string) => [
    ...salesFunnelTagsQueryKeys.base,
    'lead-tags',
    leadId
  ] as const,
} as const;

// Módulo: Negociações/Deals
export const salesFunnelDealsQueryKeys = {
  base: ['salesfunnel-deals'] as const,
  byLead: (leadId: string) => [
    ...salesFunnelDealsQueryKeys.base,
    'by-lead',
    leadId
  ] as const,
} as const;

// Módulo: IA/AI
export const salesFunnelAIQueryKeys = {
  base: ['salesfunnel-ai'] as const,
  stageControl: (stageId: string) => [
    ...salesFunnelAIQueryKeys.base,
    'stage-control',
    stageId
  ] as const,
} as const;

// Utilitários de Invalidação - ISOLADOS
export const salesFunnelInvalidation = {
  allLeads: (funnelId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'salesfunnel-leads' && 
      query.queryKey[1] === 'by-funnel' && 
      query.queryKey[2] === funnelId
  }),
  
  allStages: (funnelId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'salesfunnel-stages' && 
      query.queryKey[1] === 'by-funnel' && 
      query.queryKey[2] === funnelId
  }),
  
  allFunnels: (userId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'salesfunnel-funnels' && 
      query.queryKey[2] === userId
  }),
  
  allTags: (userId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'salesfunnel-tags' && 
      query.queryKey[1] === 'by-user' && 
      query.queryKey[2] === userId
  })
} as const;