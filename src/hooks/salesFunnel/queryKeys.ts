/**
 * Factory de Query Keys para Sales Funnel
 * Centraliza todas as chaves de query para evitar inconsistências de cache
 */

export const salesFunnelQueryKeys = {
  // Funnels
  funnels: (userId: string, canViewAllFunnels: boolean, userFunnels: string[]) => [
    'funnels', 
    userId, 
    canViewAllFunnels, 
    userFunnels.sort() // Sort para consistência
  ] as const,

  // Stages
  stages: (funnelId: string) => [
    'stages', 
    funnelId
  ] as const,

  // Leads
  leads: (funnelId: string, userId: string, canViewAllFunnels: boolean) => [
    'leads', 
    funnelId, 
    userId, 
    canViewAllFunnels
  ] as const,

  // Leads paginados (para futuro)
  leadsPaginated: (funnelId: string, userId: string, canViewAllFunnels: boolean, page: number) => [
    'leads-paginated',
    funnelId,
    userId, 
    canViewAllFunnels,
    page
  ] as const,

  // Tags
  tags: (userId: string) => [
    'tags',
    userId
  ] as const,

  // Lead tags (associações)
  leadTags: (leadId: string) => [
    'lead-tags',
    leadId
  ] as const,

  // Deals
  deals: (leadId: string) => [
    'deals',
    leadId
  ] as const,

  // AI Stage Control
  aiStageControl: (stageId: string) => [
    'ai-stage-control',
    stageId
  ] as const,

  // Funnel específico
  funnel: (funnelId: string) => [
    'funnel',
    funnelId
  ] as const
} as const;

/**
 * Utilitários para invalidação de cache
 */
export const invalidationKeys = {
  // Invalidar todos os leads de um funil
  allLeads: (funnelId: string) => ({ 
    predicate: (query: any) => 
      query.queryKey[0] === 'leads' && query.queryKey[1] === funnelId 
  }),

  // Invalidar todas as stages de um funil  
  allStages: (funnelId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'stages' && query.queryKey[1] === funnelId
  }),

  // Invalidar todos os funnels de um usuário
  allFunnels: (userId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'funnels' && query.queryKey[1] === userId
  }),

  // Invalidar tags de um usuário
  allTags: (userId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'tags' && query.queryKey[1] === userId
  })
} as const;