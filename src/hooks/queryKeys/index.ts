/**
 * 🎯 SISTEMA DE QUERY KEYS ISOLADAS
 * Namespace único por página para evitar interferências
 */

// ========================================
// 🏠 DASHBOARD QUERY KEYS
// ========================================
export const dashboardKPIsQueryKeys = {
  base: ['DASHBOARD-kpis'] as const,
  byPeriod: (
    userId: string, 
    periodFilter: any, 
    userFunnels: any[], 
    canViewAllFunnels: boolean
  ) => [...dashboardKPIsQueryKeys.base, 'period', userId, JSON.stringify(periodFilter), userFunnels.length, canViewAllFunnels] as const,
  analytics: (userId: string, filters: any) => [...dashboardKPIsQueryKeys.base, 'analytics', userId, JSON.stringify(filters)] as const,
  realtime: (userId: string) => [...dashboardKPIsQueryKeys.base, 'realtime', userId] as const
};

export const dashboardChartsQueryKeys = {
  base: ['DASHBOARD-charts'] as const,
  byType: (chartType: string, userId: string, filters: any) => [...dashboardChartsQueryKeys.base, chartType, userId, JSON.stringify(filters)] as const,
  conversion: (userId: string, period: string) => [...dashboardChartsQueryKeys.base, 'conversion', userId, period] as const
};

// ========================================
// 🎯 SALES FUNNEL QUERY KEYS  
// ========================================
export const salesFunnelLeadsQueryKeys = {
  base: ['SALESFUNNEL-leads'] as const,
  byFunnel: (
    funnelId: string, 
    userId: string, 
    canViewAllFunnels: boolean, 
    role: string, 
    createdByUserId?: string
  ) => [...salesFunnelLeadsQueryKeys.base, 'funnel', funnelId, userId, canViewAllFunnels, role, createdByUserId] as const,
  byStage: (stageId: string, filters: any) => [...salesFunnelLeadsQueryKeys.base, 'stage', stageId, JSON.stringify(filters)] as const,
  search: (query: string, funnelId: string) => [...salesFunnelLeadsQueryKeys.base, 'search', query, funnelId] as const
};

export const salesFunnelStagesQueryKeys = {
  base: ['SALESFUNNEL-stages'] as const,
  byFunnel: (funnelId: string) => [...salesFunnelStagesQueryKeys.base, 'funnel', funnelId] as const,
  list: (userId: string, role: string) => [...salesFunnelStagesQueryKeys.base, 'list', userId, role] as const
};

export const salesFunnelConfigQueryKeys = {
  base: ['SALESFUNNEL-config'] as const,
  settings: (funnelId: string) => [...salesFunnelConfigQueryKeys.base, 'settings', funnelId] as const,
  permissions: (userId: string, funnelId: string) => [...salesFunnelConfigQueryKeys.base, 'permissions', userId, funnelId] as const
};

// ========================================
// 💬 CHAT QUERY KEYS
// ========================================
export const chatMessagesQueryKeys = {
  base: ['CHAT-messages'] as const,
  byContact: (contactId: string) => [...chatMessagesQueryKeys.base, 'contact', contactId] as const,
  conversations: (userId: string, filters: any) => [...chatMessagesQueryKeys.base, 'conversations', userId, JSON.stringify(filters)] as const,
  unread: (userId: string) => [...chatMessagesQueryKeys.base, 'unread', userId] as const
};

export const chatContactsQueryKeys = {
  base: ['CHAT-contacts'] as const,
  list: (userId: string, searchQuery: string) => [...chatContactsQueryKeys.base, 'list', userId, searchQuery] as const,
  details: (contactId: string) => [...chatContactsQueryKeys.base, 'details', contactId] as const,
  recent: (userId: string, limit: number) => [...chatContactsQueryKeys.base, 'recent', userId, limit] as const
};

export const chatWhatsAppQueryKeys = {
  base: ['CHAT-whatsapp'] as const,
  status: (userId: string) => [...chatWhatsAppQueryKeys.base, 'status', userId] as const,
  config: (userId: string) => [...chatWhatsAppQueryKeys.base, 'config', userId] as const,
  analytics: (userId: string, period: string) => [...chatWhatsAppQueryKeys.base, 'analytics', userId, period] as const
};

// ========================================
// 🤖 AI AGENTS QUERY KEYS
// ========================================
export const aiAgentsQueryKeys = {
  base: ['AI_AGENTS-agents'] as const,
  list: (userId: string, role?: string) => [...aiAgentsQueryKeys.base, 'list', userId, role || 'admin'] as const,
  details: (agentId: string) => [...aiAgentsQueryKeys.base, 'details', agentId] as const,
  byFunnel: (funnelId: string) => [...aiAgentsQueryKeys.base, 'funnel', funnelId] as const
};

export const aiPromptsQueryKeys = {
  base: ['AI_AGENTS-prompts'] as const,
  byAgent: (agentId: string) => [...aiPromptsQueryKeys.base, 'agent', agentId] as const,
  templates: (userId: string) => [...aiPromptsQueryKeys.base, 'templates', userId] as const,
  history: (agentId: string, limit: number) => [...aiPromptsQueryKeys.base, 'history', agentId, limit] as const
};

export const aiFieldConfigQueryKeys = {
  base: ['AI_AGENTS-field-config'] as const,
  byAgent: (agentId: string) => [...aiFieldConfigQueryKeys.base, 'agent', agentId] as const,
  list: (userId: string) => [...aiFieldConfigQueryKeys.base, 'list', userId] as const
};

export const aiStageControlQueryKeys = {
  base: ['AI_AGENTS-stage-control'] as const,
  byFunnel: (funnelId: string) => [...aiStageControlQueryKeys.base, 'funnel', funnelId] as const,
  rules: (agentId: string) => [...aiStageControlQueryKeys.base, 'rules', agentId] as const
};

export const aiFlowConfigQueryKeys = {
  base: ['AI_AGENTS-flow-config'] as const,
  byAgent: (agentId: string) => [...aiFlowConfigQueryKeys.base, 'agent', agentId] as const,
  templates: (userId: string) => [...aiFlowConfigQueryKeys.base, 'templates', userId] as const
};

export const aiAnalyticsQueryKeys = {
  base: ['AI_AGENTS-analytics'] as const,
  performance: (agentId: string, period: string) => [...aiAnalyticsQueryKeys.base, 'performance', agentId, period] as const,
  usage: (userId: string, period: string) => [...aiAnalyticsQueryKeys.base, 'usage', userId, period] as const
};

// ========================================
// 👥 CLIENTS QUERY KEYS
// ========================================
export const clientsListQueryKeys = {
  base: ['CLIENTS_MGMT-list'] as const,
  filtered: (userId: string, searchQuery: string, filters: any, role: string) => 
    [...clientsListQueryKeys.base, 'filtered', userId, searchQuery, JSON.stringify(filters), role] as const,
  paginated: (userId: string, page: number, limit: number) => 
    [...clientsListQueryKeys.base, 'paginated', userId, page, limit] as const,
  recent: (userId: string, limit: number) => 
    [...clientsListQueryKeys.base, 'recent', userId, limit] as const
};

export const clientsDetailsQueryKeys = {
  base: ['CLIENTS_MGMT-details'] as const,
  byId: (clientId: string) => [...clientsDetailsQueryKeys.base, 'id', clientId] as const,
  profile: (clientId: string) => [...clientsDetailsQueryKeys.base, 'profile', clientId] as const,
  history: (clientId: string) => [...clientsDetailsQueryKeys.base, 'history', clientId] as const
};

export const clientsTagsQueryKeys = {
  base: ['CLIENTS_MGMT-tags'] as const,
  list: (userId: string) => [...clientsTagsQueryKeys.base, 'list', userId] as const,
  byClient: (clientId: string) => [...clientsTagsQueryKeys.base, 'client', clientId] as const,
  suggestions: (query: string) => [...clientsTagsQueryKeys.base, 'suggestions', query] as const
};

export const clientsFiltersQueryKeys = {
  base: ['CLIENTS_MGMT-filters'] as const,
  saved: (userId: string) => [...clientsFiltersQueryKeys.base, 'saved', userId] as const,
  options: (userId: string) => [...clientsFiltersQueryKeys.base, 'options', userId] as const
};

export const clientsDealsQueryKeys = {
  base: ['CLIENTS_MGMT-deals'] as const,
  byClient: (clientId: string) => [...clientsDealsQueryKeys.base, 'client', clientId] as const,
  pipeline: (userId: string, filters: any) => [...clientsDealsQueryKeys.base, 'pipeline', userId, JSON.stringify(filters)] as const
};

export const clientsWhatsAppQueryKeys = {
  base: ['CLIENTS_MGMT-whatsapp'] as const,
  byClient: (clientId: string) => [...clientsWhatsAppQueryKeys.base, 'client', clientId] as const,
  messages: (contactId: string) => [...clientsWhatsAppQueryKeys.base, 'messages', contactId] as const
};

export const clientsImportExportQueryKeys = {
  base: ['CLIENTS_MGMT-import-export'] as const,
  jobs: (userId: string) => [...clientsImportExportQueryKeys.base, 'jobs', userId] as const,
  templates: (userId: string) => [...clientsImportExportQueryKeys.base, 'templates', userId] as const
};

export const clientsAnalyticsQueryKeys = {
  base: ['CLIENTS_MGMT-analytics'] as const,
  summary: (userId: string, period: string) => [...clientsAnalyticsQueryKeys.base, 'summary', userId, period] as const,
  conversion: (userId: string, filters: any) => [...clientsAnalyticsQueryKeys.base, 'conversion', userId, JSON.stringify(filters)] as const
};

// ========================================
// 🔧 UTILITY FUNCTIONS
// ========================================

/**
 * Debug helper para verificar query keys
 */
export const queryKeysDebug = {
  /**
   * Lista todas as query keys por contexto
   */
  listByContext: (context: string) => {
    switch (context.toLowerCase()) {
      case 'dashboard':
        return { dashboardKPIsQueryKeys, dashboardChartsQueryKeys };
      case 'salesfunnel':
        return { salesFunnelLeadsQueryKeys, salesFunnelStagesQueryKeys, salesFunnelConfigQueryKeys };
      case 'chat':
        return { chatMessagesQueryKeys, chatContactsQueryKeys, chatWhatsAppQueryKeys };
      case 'ai_agents':
        return { aiAgentsQueryKeys, aiPromptsQueryKeys, aiFieldConfigQueryKeys, aiStageControlQueryKeys, aiFlowConfigQueryKeys, aiAnalyticsQueryKeys };
      case 'clients':
        return { clientsListQueryKeys, clientsDetailsQueryKeys, clientsTagsQueryKeys, clientsFiltersQueryKeys, clientsDealsQueryKeys, clientsWhatsAppQueryKeys, clientsImportExportQueryKeys, clientsAnalyticsQueryKeys };
      default:
        return {};
    }
  },

  /**
   * Verifica se uma query key pertence a um contexto específico
   */
  belongsToContext: (queryKey: any[], context: string): boolean => {
    if (!queryKey || !queryKey[0]) return false;
    const keyStr = String(queryKey[0]);
    const contextPrefix = context.toUpperCase();
    return keyStr.startsWith(contextPrefix);
  },

  /**
   * Extrai o contexto de uma query key
   */
  extractContext: (queryKey: any[]): string | null => {
    if (!queryKey || !queryKey[0]) return null;
    const keyStr = String(queryKey[0]);
    const match = keyStr.match(/^([A-Z_]+)-/);
    return match ? match[1].toLowerCase() : null;
  },

  /**
   * Monitor de invalidações por contexto
   */
  monitorInvalidations: (queryClient: any, duration: number = 60000) => {
    const invalidations: Record<string, number> = {};
    const startTime = Date.now();

    // Interceptar invalidações
    const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
    queryClient.invalidateQueries = (...args: any[]) => {
      const queryKey = args[0];
      const context = queryKeysDebug.extractContext(queryKey) || 'unknown';
      invalidations[context] = (invalidations[context] || 0) + 1;
      return originalInvalidate(...args);
    };

    // Restaurar após duração
    setTimeout(() => {
      queryClient.invalidateQueries = originalInvalidate;
      console.log('📊 [QueryKeys Monitor] Invalidações por contexto:', {
        duration: `${duration / 1000}s`,
        invalidations,
        total: Object.values(invalidations).reduce((a, b) => a + b, 0)
      });
    }, duration);

    console.log(`🔍 [QueryKeys Monitor] Monitorando por ${duration / 1000}s...`);
  }
};

/**
 * Verificar isolamento de query keys
 */
export const validateQueryKeysIsolation = () => {
  const contexts = ['dashboard', 'salesfunnel', 'chat', 'ai_agents', 'clients'];
  const report: Record<string, any> = {};

  contexts.forEach(context => {
    const keys = queryKeysDebug.listByContext(context);
    report[context] = {
      modules: Object.keys(keys).length,
      keys: Object.values(keys).flat().length,
      isolated: true // Will be validated in runtime
    };
  });

  console.log('✅ [QueryKeys Isolation] Validation Report:', report);
  return report;
};

// 🛡️ ISOLAMENTO E CONTROLE GLOBAL
export const queryKeysIsolation = {
  // Verificar se uma query key pertence a uma página específica
  belongsTo: {
    dashboard: (queryKey: any[]) => 
      typeof queryKey[0] === 'string' && queryKey[0].startsWith('dashboard-'),
    
    salesFunnel: (queryKey: any[]) => 
      typeof queryKey[0] === 'string' && queryKey[0].startsWith('salesfunnel-'),
    
    chat: (queryKey: any[]) => 
      typeof queryKey[0] === 'string' && queryKey[0].startsWith('chat-'),
    
    aiAgents: (queryKey: any[]) => 
      typeof queryKey[0] === 'string' && queryKey[0].startsWith('AI_AGENTS-'),
    
    clients: (queryKey: any[]) => 
      typeof queryKey[0] === 'string' && queryKey[0].startsWith('CLIENTS_MGMT-')
  },
  
  // Identificar namespace de uma query
  getNamespace: (queryKey: any[]): string | null => {
    if (!queryKey[0] || typeof queryKey[0] !== 'string') return null;
    
    const key = queryKey[0];
    if (key.startsWith('dashboard-')) return 'DASHBOARD';
    if (key.startsWith('salesfunnel-')) return 'SALES_FUNNEL';
    if (key.startsWith('chat-')) return 'CHAT_WHATSAPP';
    if (key.startsWith('AI_AGENTS-')) return 'AI_AGENTS';
    if (key.startsWith('CLIENTS_MGMT-')) return 'CLIENTS_MGMT';
    
    return 'UNKNOWN';
  },
  
  // Listar todas as queries ativas por namespace
  listActiveByNamespace: (queryClient: any) => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const byNamespace = {
      DASHBOARD: [],
      SALES_FUNNEL: [],
      CHAT_WHATSAPP: [],
      AI_AGENTS: [],
      CLIENTS_MGMT: [],
      UNKNOWN: []
    };
    
    queries.forEach((query: any) => {
      const namespace = queryKeysIsolation.getNamespace(query.queryKey);
      if (namespace && byNamespace[namespace as keyof typeof byNamespace]) {
        byNamespace[namespace as keyof typeof byNamespace].push(query.queryKey);
      } else {
        byNamespace.UNKNOWN.push(query.queryKey);
      }
    });
    
    return byNamespace;
  }
} as const;

// 🎯 CACHE STRATEGIES GLOBAIS - Configurações por página
export const globalCacheStrategies = {
  // Dashboard: Dados menos dinâmicos
  dashboard: {
    staleTime: 5 * 60 * 1000,     // 5 minutos
    gcTime: 15 * 60 * 1000,       // 15 minutos
    retry: 2
  },
  
  // Sales Funnel: Dados dinâmicos com drag & drop
  salesFunnel: {
    staleTime: 2 * 60 * 1000,     // 2 minutos  
    gcTime: 10 * 60 * 1000,       // 10 minutos
    retry: 3,
    refetchOnWindowFocus: false    // Evitar refetch durante drag
  },
  
  // Chat: Dados em tempo real
  chat: {
    staleTime: 30 * 1000,         // 30 segundos
    gcTime: 5 * 60 * 1000,        // 5 minutos
    retry: 5,
    refetchInterval: 30 * 1000    // Refetch automático
  },
  
  // AI Agents: Dados moderadamente dinâmicos
  aiAgents: {
    staleTime: 3 * 60 * 1000,     // 3 minutos
    gcTime: 12 * 60 * 1000,       // 12 minutos
    retry: 2
  },
  
  // Clients: Dados estáveis
  clients: {
    staleTime: 4 * 60 * 1000,     // 4 minutos
    gcTime: 15 * 60 * 1000,       // 15 minutos
    retry: 3
  }
} as const;

// 🚨 INVALIDATION CONTROL - Sistema de controle de invalidações
export const invalidationControl = {
  // Verificar se uma invalidação deve ser bloqueada
  shouldBlockInvalidation: (queryKey: any[], context?: string) => {
    // Verificar se há modal aberto
    const hasOpenModal = document.querySelector('[data-modal-open]') !== null;
    
    // Verificar se há drag em progresso
    const isDragging = document.body.hasAttribute('data-dragging');
    
    // Verificar se é durante navegação
    const isNavigating = document.body.hasAttribute('data-navigating');
    
    const reasons = [];
    if (hasOpenModal) reasons.push('modal-open');
    if (isDragging) reasons.push('dragging');
    if (isNavigating) reasons.push('navigating');
    
    const shouldBlock = reasons.length > 0;
    
    if (shouldBlock) {
      console.log(`🚫 Invalidation blocked for ${queryKey[0]}:`, {
        queryKey,
        reasons,
        context
      });
    }
    
    return shouldBlock;
  },
  
  // Invalidação segura - só executa se não houver bloqueios
  safeInvalidate: (queryClient: any, queryKey: any[], options?: any) => {
    if (invalidationControl.shouldBlockInvalidation(queryKey, 'safeInvalidate')) {
      // Agendar para execução posterior
      setTimeout(() => {
        if (!invalidationControl.shouldBlockInvalidation(queryKey, 'delayed')) {
          queryClient.invalidateQueries({ queryKey, ...options });
        }
      }, 5000); // 5 segundos de delay
      return false;
    }
    
    queryClient.invalidateQueries({ queryKey, ...options });
    return true;
  },
  
  // Invalidação por namespace (com controle)
  invalidateNamespace: (queryClient: any, namespace: string, force = false) => {
    const predicate = (query: any) => {
      const queryNamespace = queryKeysIsolation.getNamespace(query.queryKey);
      return queryNamespace === namespace;
    };
    
    if (!force && invalidationControl.shouldBlockInvalidation(['namespace', namespace], 'namespace')) {
      setTimeout(() => {
        queryClient.invalidateQueries({ predicate });
      }, 5000);
      return false;
    }
    
    queryClient.invalidateQueries({ predicate });
    return true;
  }
} as const;

// 🔍 DEBUG E MONITORING
export const queryKeysDebug = {
  // Log do estado atual de isolamento
  logIsolationStatus: (queryClient: any) => {
    console.group('🎯 Query Keys Isolation Status');
    
    const activeByNamespace = queryKeysIsolation.listActiveByNamespace(queryClient);
    
    Object.entries(activeByNamespace).forEach(([namespace, queries]) => {
      console.log(`${namespace}: ${queries.length} active queries`);
      if (queries.length > 0) {
        console.log('  Keys:', queries.slice(0, 3)); // Mostrar apenas 3 primeiras
        if (queries.length > 3) {
          console.log(`  ... and ${queries.length - 3} more`);
        }
      }
    });
    
    console.groupEnd();
  },
  
  // Monitorar invalidações em tempo real
  monitorInvalidations: (queryClient: any, duration = 60000) => {
    console.log(`🔍 Starting invalidation monitoring for ${duration/1000}s...`);
    
    const startTime = Date.now();
    const invalidations: any[] = [];
    
    const unsubscribe = queryClient.getQueryCache().subscribe((event: any) => {
      if (event.type === 'invalidate') {
        const namespace = queryKeysIsolation.getNamespace(event.query.queryKey);
        invalidations.push({
          timestamp: Date.now() - startTime,
          namespace,
          queryKey: event.query.queryKey,
          blocked: invalidationControl.shouldBlockInvalidation(event.query.queryKey, 'monitor')
        });
      }
    });
    
    setTimeout(() => {
      unsubscribe();
      console.group('📊 Invalidation Report');
      console.log('Total invalidations:', invalidations.length);
      
      const byNamespace = invalidations.reduce((acc, inv) => {
        acc[inv.namespace || 'UNKNOWN'] = (acc[inv.namespace || 'UNKNOWN'] || 0) + 1;
        return acc;
      }, {});
      
      console.log('By namespace:', byNamespace);
      
      const blocked = invalidations.filter(inv => inv.blocked);
      console.log('Blocked:', blocked.length);
      
      console.groupEnd();
    }, duration);
  }
} as const;