/**
 * AI AGENTS - Query Keys - COMPLETAMENTE ISOLADO
 * 
 * Estrutura de isolamento máximo:
 * - Prefixo único: 'AI_AGENTS-'
 * - Separado por módulos/seções dos agentes
 * - Zero conflito com outras páginas (Dashboard, Sales Funnel, Chat, Clients)
 * - Sessões isoladas: agents, prompts, configurations, stages
 */

// 🤖 Módulo: Gerenciamento de Agentes IA
export const aiAgentsQueryKeys = {
  base: ['AI_AGENTS-agents'] as const,
  list: (userId: string, role?: string) => [
    ...aiAgentsQueryKeys.base,
    'list',
    userId,
    role || 'admin'
  ] as const,
  detail: (agentId: string) => [
    ...aiAgentsQueryKeys.base,
    'detail',
    agentId
  ] as const,
  byCompany: (companyId: string) => [
    ...aiAgentsQueryKeys.base,
    'by-company',
    companyId
  ] as const,
} as const;

// 📝 Módulo: Prompts e Configurações
export const aiPromptsQueryKeys = {
  base: ['AI_AGENTS-prompts'] as const,
  byAgent: (agentId: string) => [
    ...aiPromptsQueryKeys.base,
    'by-agent',
    agentId
  ] as const,
  templates: (userId: string) => [
    ...aiPromptsQueryKeys.base,
    'templates',
    userId
  ] as const,
  examples: (promptId: string) => [
    ...aiPromptsQueryKeys.base,
    'examples',
    promptId
  ] as const,
  phrases: (agentId: string) => [
    ...aiPromptsQueryKeys.base,
    'phrases',
    agentId
  ] as const,
} as const;

// ⚙️ Módulo: Configurações de Campo
export const aiFieldConfigQueryKeys = {
  base: ['AI_AGENTS-field-config'] as const,
  byAgent: (agentId: string) => [
    ...aiFieldConfigQueryKeys.base,
    'by-agent',
    agentId
  ] as const,
  byType: (configType: string) => [
    ...aiFieldConfigQueryKeys.base,
    'by-type',
    configType
  ] as const,
} as const;

// 🎯 Módulo: Controle de Estágios (IA por Stage)
export const aiStageControlQueryKeys = {
  base: ['AI_AGENTS-stage-control'] as const,
  byStage: (stageId: string) => [
    ...aiStageControlQueryKeys.base,
    'by-stage',
    stageId
  ] as const,
  byFunnel: (funnelId: string) => [
    ...aiStageControlQueryKeys.base,
    'by-funnel',
    funnelId
  ] as const,
  settings: (stageId: string, agentId: string) => [
    ...aiStageControlQueryKeys.base,
    'settings',
    stageId,
    agentId
  ] as const,
} as const;

// 🔄 Módulo: Fluxos e Automações
export const aiFlowConfigQueryKeys = {
  base: ['AI_AGENTS-flow-config'] as const,
  byAgent: (agentId: string) => [
    ...aiFlowConfigQueryKeys.base,
    'by-agent',
    agentId
  ] as const,
  steps: (flowId: string) => [
    ...aiFlowConfigQueryKeys.base,
    'steps',
    flowId
  ] as const,
  conditions: (stepId: string) => [
    ...aiFlowConfigQueryKeys.base,
    'conditions',
    stepId
  ] as const,
} as const;

// 📊 Módulo: Analytics e Performance de IA
export const aiAnalyticsQueryKeys = {
  base: ['AI_AGENTS-analytics'] as const,
  performance: (agentId: string, dateRange: string) => [
    ...aiAnalyticsQueryKeys.base,
    'performance',
    agentId,
    dateRange
  ] as const,
  usage: (userId: string, period: string) => [
    ...aiAnalyticsQueryKeys.base,
    'usage',
    userId,
    period
  ] as const,
  metrics: (agentId: string) => [
    ...aiAnalyticsQueryKeys.base,
    'metrics',
    agentId
  ] as const,
} as const;

// 🛡️ Utilitários de Invalidação - COMPLETAMENTE ISOLADOS DOS AI AGENTS
export const aiAgentsInvalidation = {
  // Invalidar todos os agentes
  allAgents: (userId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'AI_AGENTS-agents' &&
      query.queryKey[2] === userId
  }),
  
  // Invalidar todos os prompts de um agente específico
  agentPrompts: (agentId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'AI_AGENTS-prompts' &&
      query.queryKey[2] === agentId
  }),
  
  // Invalidar configurações de campo
  fieldConfigs: (agentId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'AI_AGENTS-field-config' &&
      query.queryKey[2] === agentId
  }),
  
  // Invalidar controle de estágios por funil
  stageControls: (funnelId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'AI_AGENTS-stage-control' &&
      query.queryKey[1] === 'by-funnel' &&
      query.queryKey[2] === funnelId
  }),
  
  // Invalidar apenas analytics
  analytics: (agentId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'AI_AGENTS-analytics' &&
      query.queryKey[2] === agentId
  }),
  
  // Invalidar TUDO relacionado aos AI Agents (usar com cuidado)
  everything: () => ({
    predicate: (query: any) => 
      typeof query.queryKey[0] === 'string' && 
      query.queryKey[0].startsWith('AI_AGENTS-')
  })
} as const;

// 🎯 Cache Strategies - Específicas para AI Agents
export const aiAgentsCacheConfig = {
  // Agentes: Cache longo (raramente mudam)
  agents: {
    staleTime: 10 * 60 * 1000,    // 10 minutos
    gcTime: 30 * 60 * 1000,       // 30 minutos
  },
  
  // Prompts: Cache médio (mudanças moderadas)
  prompts: {
    staleTime: 5 * 60 * 1000,     // 5 minutos
    gcTime: 15 * 60 * 1000,       // 15 minutos
  },
  
  // Stage Control: Cache rápido (mudanças frequentes)
  stageControl: {
    staleTime: 2 * 60 * 1000,     // 2 minutos
    gcTime: 5 * 60 * 1000,        // 5 minutos
  },
  
  // Analytics: Cache muito curto (dados em tempo real)
  analytics: {
    staleTime: 30 * 1000,         // 30 segundos
    gcTime: 2 * 60 * 1000,        // 2 minutos
  }
} as const;

// 🔍 Debug Helpers - Para monitoramento
export const aiAgentsDebug = {
  logAllQueries: () => {
    console.group('🤖 AI Agents - Active Queries');
    // Implementation will be added when integrating with QueryClient
    console.groupEnd();
  },
  
  getQueryKeys: () => ({
    agents: aiAgentsQueryKeys,
    prompts: aiPromptsQueryKeys,
    fieldConfig: aiFieldConfigQueryKeys,
    stageControl: aiStageControlQueryKeys,
    flowConfig: aiFlowConfigQueryKeys,
    analytics: aiAnalyticsQueryKeys
  })
} as const;