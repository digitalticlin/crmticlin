/**
 * CLIENTS MANAGEMENT - Query Keys - COMPLETAMENTE ISOLADO
 * 
 * Estrutura de isolamento máximo:
 * - Prefixo único: 'CLIENTS_MGMT-'
 * - Separado por módulos/seções dos clientes
 * - Zero conflito com outras páginas (Dashboard, Sales Funnel, Chat, AI Agents)
 * - IMPORTANTE: Usa tabela 'leads' mas com contexto isolado
 * - Sessões isoladas: list, details, filters, imports, analytics
 */

// 👥 Módulo: Lista e Gerenciamento de Clientes
export const clientsListQueryKeys = {
  base: ['CLIENTS_MGMT-list'] as const,
  all: (userId: string, role: string) => [
    ...clientsListQueryKeys.base,
    'all',
    userId,
    role
  ] as const,
  filtered: (userId: string, searchQuery: string, filters: any, role: string) => [
    ...clientsListQueryKeys.base,
    'filtered',
    userId,
    searchQuery,
    JSON.stringify(filters),
    role
  ] as const,
  paginated: (userId: string, page: number, limit: number, role: string) => [
    ...clientsListQueryKeys.base,
    'paginated',
    userId,
    page,
    limit,
    role
  ] as const,
  byCompany: (companyId: string) => [
    ...clientsListQueryKeys.base,
    'by-company',
    companyId
  ] as const,
} as const;

// 🔍 Módulo: Detalhes e Perfil do Cliente
export const clientsDetailsQueryKeys = {
  base: ['CLIENTS_MGMT-details'] as const,
  byId: (clientId: string) => [
    ...clientsDetailsQueryKeys.base,
    'by-id',
    clientId
  ] as const,
  profile: (clientId: string) => [
    ...clientsDetailsQueryKeys.base,
    'profile',
    clientId
  ] as const,
  history: (clientId: string) => [
    ...clientsDetailsQueryKeys.base,
    'history',
    clientId
  ] as const,
  interactions: (clientId: string, dateRange: string) => [
    ...clientsDetailsQueryKeys.base,
    'interactions',
    clientId,
    dateRange
  ] as const,
} as const;

// 🏷️ Módulo: Tags de Clientes (isolado do Sales Funnel)
export const clientsTagsQueryKeys = {
  base: ['CLIENTS_MGMT-tags'] as const,
  all: (userId: string) => [
    ...clientsTagsQueryKeys.base,
    'all',
    userId
  ] as const,
  byClient: (clientId: string) => [
    ...clientsTagsQueryKeys.base,
    'by-client',
    clientId
  ] as const,
  categories: (userId: string) => [
    ...clientsTagsQueryKeys.base,
    'categories',
    userId
  ] as const,
} as const;

// 🔧 Módulo: Filtros Avançados (isolado)
export const clientsFiltersQueryKeys = {
  base: ['CLIENTS_MGMT-filters'] as const,
  options: (userId: string, role: string) => [
    ...clientsFiltersQueryKeys.base,
    'options',
    userId,
    role
  ] as const,
  companies: (userId: string) => [
    ...clientsFiltersQueryKeys.base,
    'companies',
    userId
  ] as const,
  owners: (userId: string) => [
    ...clientsFiltersQueryKeys.base,
    'owners',
    userId
  ] as const,
  funnelStages: (userId: string) => [
    ...clientsFiltersQueryKeys.base,
    'funnel-stages',
    userId
  ] as const,
  tags: (userId: string) => [
    ...clientsFiltersQueryKeys.base,
    'tags',
    userId
  ] as const,
} as const;

// 📊 Módulo: Deals e Negociações do Cliente
export const clientsDealsQueryKeys = {
  base: ['CLIENTS_MGMT-deals'] as const,
  byClient: (clientId: string) => [
    ...clientsDealsQueryKeys.base,
    'by-client',
    clientId
  ] as const,
  active: (clientId: string) => [
    ...clientsDealsQueryKeys.base,
    'active',
    clientId
  ] as const,
  history: (clientId: string, dateRange: string) => [
    ...clientsDealsQueryKeys.base,
    'history',
    clientId,
    dateRange
  ] as const,
  value: (clientId: string) => [
    ...clientsDealsQueryKeys.base,
    'value',
    clientId
  ] as const,
} as const;

// 💬 Módulo: WhatsApp e Comunicação (isolado do Chat)
export const clientsWhatsAppQueryKeys = {
  base: ['CLIENTS_MGMT-whatsapp'] as const,
  instances: (userId: string) => [
    ...clientsWhatsAppQueryKeys.base,
    'instances',
    userId
  ] as const,
  conversations: (clientId: string) => [
    ...clientsWhatsAppQueryKeys.base,
    'conversations',
    clientId
  ] as const,
  lastMessages: (clientId: string) => [
    ...clientsWhatsAppQueryKeys.base,
    'last-messages',
    clientId
  ] as const,
  status: (clientId: string, instanceId: string) => [
    ...clientsWhatsAppQueryKeys.base,
    'status',
    clientId,
    instanceId
  ] as const,
} as const;

// 📥 Módulo: Importação e Exportação
export const clientsImportExportQueryKeys = {
  base: ['CLIENTS_MGMT-import-export'] as const,
  importHistory: (userId: string) => [
    ...clientsImportExportQueryKeys.base,
    'import-history',
    userId
  ] as const,
  templates: (userId: string) => [
    ...clientsImportExportQueryKeys.base,
    'templates',
    userId
  ] as const,
  validation: (importId: string) => [
    ...clientsImportExportQueryKeys.base,
    'validation',
    importId
  ] as const,
  progress: (jobId: string) => [
    ...clientsImportExportQueryKeys.base,
    'progress',
    jobId
  ] as const,
} as const;

// 📈 Módulo: Analytics de Clientes (isolado do Dashboard)
export const clientsAnalyticsQueryKeys = {
  base: ['CLIENTS_MGMT-analytics'] as const,
  summary: (userId: string, dateRange: string) => [
    ...clientsAnalyticsQueryKeys.base,
    'summary',
    userId,
    dateRange
  ] as const,
  conversion: (userId: string, period: string) => [
    ...clientsAnalyticsQueryKeys.base,
    'conversion',
    userId,
    period
  ] as const,
  activity: (userId: string, timeframe: string) => [
    ...clientsAnalyticsQueryKeys.base,
    'activity',
    userId,
    timeframe
  ] as const,
  segments: (userId: string) => [
    ...clientsAnalyticsQueryKeys.base,
    'segments',
    userId
  ] as const,
} as const;

// 🛡️ Utilitários de Invalidação - COMPLETAMENTE ISOLADOS DOS CLIENTES
export const clientsInvalidation = {
  // Invalidar toda a lista de clientes
  allLists: (userId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'CLIENTS_MGMT-list' &&
      query.queryKey[2] === userId
  }),
  
  // Invalidar detalhes de um cliente específico
  clientDetails: (clientId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'CLIENTS_MGMT-details' &&
      query.queryKey[2] === clientId
  }),
  
  // Invalidar tags de clientes
  allTags: (userId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'CLIENTS_MGMT-tags' &&
      query.queryKey[2] === userId
  }),
  
  // Invalidar filtros de clientes
  allFilters: (userId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'CLIENTS_MGMT-filters' &&
      query.queryKey[2] === userId
  }),
  
  // Invalidar deals de um cliente
  clientDeals: (clientId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'CLIENTS_MGMT-deals' &&
      query.queryKey[2] === clientId
  }),
  
  // Invalidar WhatsApp de um cliente
  clientWhatsApp: (clientId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'CLIENTS_MGMT-whatsapp' &&
      query.queryKey[2] === clientId
  }),
  
  // Invalidar imports/exports
  importExport: (userId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'CLIENTS_MGMT-import-export' &&
      query.queryKey[2] === userId
  }),
  
  // Invalidar analytics de clientes
  analytics: (userId: string) => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'CLIENTS_MGMT-analytics' &&
      query.queryKey[2] === userId
  }),
  
  // Invalidar TUDO relacionado aos Clientes (usar com cuidado)
  everything: () => ({
    predicate: (query: any) => 
      typeof query.queryKey[0] === 'string' && 
      query.queryKey[0].startsWith('CLIENTS_MGMT-')
  })
} as const;

// 🎯 Cache Strategies - Específicas para Clientes
export const clientsCacheConfig = {
  // Lista de clientes: Cache médio (mudanças moderadas)
  list: {
    staleTime: 5 * 60 * 1000,     // 5 minutos
    gcTime: 15 * 60 * 1000,       // 15 minutos
  },
  
  // Detalhes do cliente: Cache longo (raramente muda)
  details: {
    staleTime: 10 * 60 * 1000,    // 10 minutos
    gcTime: 30 * 60 * 1000,       // 30 minutos
  },
  
  // Filtros: Cache muito longo (raramente muda)
  filters: {
    staleTime: 15 * 60 * 1000,    // 15 minutos
    gcTime: 60 * 60 * 1000,       // 60 minutos
  },
  
  // Tags: Cache médio (mudanças ocasionais)
  tags: {
    staleTime: 8 * 60 * 1000,     // 8 minutos
    gcTime: 25 * 60 * 1000,       // 25 minutos
  },
  
  // Deals: Cache rápido (mudanças frequentes)
  deals: {
    staleTime: 3 * 60 * 1000,     // 3 minutos
    gcTime: 10 * 60 * 1000,       // 10 minutos
  },
  
  // WhatsApp: Cache muito rápido (tempo real)
  whatsapp: {
    staleTime: 1 * 60 * 1000,     // 1 minuto
    gcTime: 5 * 60 * 1000,        // 5 minutos
  },
  
  // Analytics: Cache curto (dados atualizados)
  analytics: {
    staleTime: 2 * 60 * 1000,     // 2 minutos
    gcTime: 8 * 60 * 1000,        // 8 minutos
  },
  
  // Import/Export: Cache muito curto (progress tracking)
  importExport: {
    staleTime: 30 * 1000,         // 30 segundos
    gcTime: 2 * 60 * 1000,        // 2 minutos
  }
} as const;

// 🔍 Debug Helpers - Para monitoramento de clientes
export const clientsDebug = {
  logAllQueries: () => {
    console.group('👥 Clients - Active Queries');
    // Implementation will be added when integrating with QueryClient
    console.groupEnd();
  },
  
  getQueryKeys: () => ({
    list: clientsListQueryKeys,
    details: clientsDetailsQueryKeys,
    tags: clientsTagsQueryKeys,
    filters: clientsFiltersQueryKeys,
    deals: clientsDealsQueryKeys,
    whatsapp: clientsWhatsAppQueryKeys,
    importExport: clientsImportExportQueryKeys,
    analytics: clientsAnalyticsQueryKeys
  }),
  
  countActiveQueries: () => {
    // Will count active CLIENTS_MGMT- queries
    return 0; // Placeholder
  }
} as const;

// ⚠️ COMPATIBILIDADE TEMPORÁRIA
// Durante a migração, manter algumas keys antigas para evitar quebras
export const clientsLegacyCompat = {
  // Query key antiga -> nova (para migração gradual)
  migrate: (oldKey: any[]) => {
    if (oldKey[0] === 'clients') {
      return clientsListQueryKeys.all(oldKey[1], oldKey[2] || 'admin');
    }
    return oldKey;
  },
  
  // Verificar se é query antiga
  isLegacyKey: (queryKey: any[]) => {
    return queryKey[0] === 'clients' && !queryKey[0].startsWith('CLIENTS_MGMT-');
  }
} as const;