/**
 * 🗄️ ISOLATED CACHE STRATEGIES
 * 
 * Estratégias de cache isoladas por contexto para evitar interferências
 * entre páginas e otimizar performance específica de cada módulo.
 * 
 * CARACTERÍSTICAS:
 * - Cache TTL específico por tipo de dado
 * - Garbage collection otimizada por contexto
 * - Prefetching inteligente
 * - Cache warming automático
 * - Eviction policies personalizadas
 */

import { QueryClient } from '@tanstack/react-query';

// 🎯 Cache Configuration Types
interface CacheStrategy {
  staleTime: number;        // Tempo que dados ficam "frescos"
  gcTime: number;          // Tempo que dados ficam na memória
  retry: number;           // Número de tentativas em caso de erro
  retryDelay: number;      // Delay entre tentativas
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchInterval?: number;
  maxQueries?: number;     // Limite de queries simultâneas
  prefetchTime?: number;   // Tempo para prefetch automático
}

interface ContextCacheConfig {
  [queryType: string]: CacheStrategy;
}

// 📊 CONFIGURAÇÕES ESPECÍFICAS POR CONTEXTO

// 🏠 DASHBOARD - Dados menos críticos, cache mais longo
export const dashboardCacheConfig: ContextCacheConfig = {
  // KPIs: Cache longo, dados não mudam frequentemente
  kpis: {
    staleTime: 10 * 60 * 1000,      // 10 minutos fresh
    gcTime: 30 * 60 * 1000,         // 30 minutos na memória
    retry: 2,
    retryDelay: 2000,
    refetchOnWindowFocus: false,     // KPIs não precisam refetch constante
    maxQueries: 10,
    prefetchTime: 5 * 60 * 1000     // Prefetch a cada 5 minutos
  },
  
  // Gráficos: Cache médio, podem ser atualizados ocasionalmente
  charts: {
    staleTime: 5 * 60 * 1000,       // 5 minutos fresh
    gcTime: 15 * 60 * 1000,         // 15 minutos na memória
    retry: 3,
    retryDelay: 1500,
    refetchOnWindowFocus: true,      // Refetch ao voltar para a aba
    maxQueries: 15
  },
  
  // Configurações: Cache muito longo, raramente mudam
  config: {
    staleTime: 30 * 60 * 1000,      // 30 minutos fresh
    gcTime: 60 * 60 * 1000,         // 1 hora na memória
    retry: 1,
    retryDelay: 3000,
    refetchOnWindowFocus: false,
    maxQueries: 5
  }
};

// 📊 SALES FUNNEL - Dados dinâmicos, cache mais curto
export const salesFunnelCacheConfig: ContextCacheConfig = {
  // Leads: Cache curto, mudanças frequentes via drag & drop
  leads: {
    staleTime: 1 * 60 * 1000,       // 1 minuto fresh
    gcTime: 5 * 60 * 1000,          // 5 minutos na memória
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false,     // Controlado por real-time
    refetchOnReconnect: true,
    maxQueries: 20,                  // Múltiplos funis simultâneos
    prefetchTime: 2 * 60 * 1000     // Prefetch rápido
  },
  
  // Estágios: Cache médio, estrutura mais estável
  stages: {
    staleTime: 5 * 60 * 1000,       // 5 minutos fresh  
    gcTime: 15 * 60 * 1000,         // 15 minutos na memória
    retry: 2,
    retryDelay: 1500,
    refetchOnWindowFocus: false,     // Estrutura não muda muito
    maxQueries: 15
  },
  
  // Funis: Cache médio-longo, não mudam frequentemente
  funnels: {
    staleTime: 10 * 60 * 1000,      // 10 minutos fresh
    gcTime: 20 * 60 * 1000,         // 20 minutos na memória
    retry: 2,
    retryDelay: 2000,
    refetchOnWindowFocus: true,
    maxQueries: 10
  },
  
  // Tags: Cache longo, raramente mudam
  tags: {
    staleTime: 15 * 60 * 1000,      // 15 minutos fresh
    gcTime: 30 * 60 * 1000,         // 30 minutos na memória
    retry: 1,
    retryDelay: 2500,
    refetchOnWindowFocus: false,
    maxQueries: 5
  },
  
  // Deals: Cache curto, dados transacionais
  deals: {
    staleTime: 2 * 60 * 1000,       // 2 minutos fresh
    gcTime: 8 * 60 * 1000,          // 8 minutos na memória
    retry: 3,
    retryDelay: 1200,
    refetchOnWindowFocus: true,
    maxQueries: 25
  }
};

// 💬 CHAT - Dados em tempo real, cache muito curto
export const chatCacheConfig: ContextCacheConfig = {
  // Mensagens: Cache muito curto, tempo real
  messages: {
    staleTime: 30 * 1000,           // 30 segundos fresh
    gcTime: 2 * 60 * 1000,          // 2 minutos na memória
    retry: 5,                        // Mais tentativas para chat
    retryDelay: 500,                 // Retry rápido
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30 * 1000,      // Refetch automático a cada 30s
    maxQueries: 50,                  // Muitas conversas simultâneas
    prefetchTime: 15 * 1000          // Prefetch muito rápido
  },
  
  // Contatos: Cache curto, lista dinâmica
  contacts: {
    staleTime: 1 * 60 * 1000,       // 1 minuto fresh
    gcTime: 5 * 60 * 1000,          // 5 minutos na memória
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    maxQueries: 30
  },
  
  // Leads (contexto chat): Cache curto
  leads: {
    staleTime: 2 * 60 * 1000,       // 2 minutos fresh
    gcTime: 8 * 60 * 1000,          // 8 minutos na memória
    retry: 3,
    retryDelay: 1200,
    refetchOnWindowFocus: true,
    maxQueries: 25
  },
  
  // Estágios (contexto chat): Cache médio
  stages: {
    staleTime: 5 * 60 * 1000,       // 5 minutos fresh
    gcTime: 12 * 60 * 1000,         // 12 minutos na memória
    retry: 2,
    retryDelay: 1500,
    refetchOnWindowFocus: false,
    maxQueries: 10
  }
};

// 🤖 AI AGENTS - Dados moderadamente dinâmicos
export const aiAgentsCacheConfig: ContextCacheConfig = {
  // Agentes: Cache médio-longo, estrutura estável
  agents: {
    staleTime: 8 * 60 * 1000,       // 8 minutos fresh
    gcTime: 20 * 60 * 1000,         // 20 minutos na memória
    retry: 2,
    retryDelay: 2000,
    refetchOnWindowFocus: true,
    maxQueries: 15
  },
  
  // Prompts: Cache médio, configurações mudam ocasionalmente
  prompts: {
    staleTime: 5 * 60 * 1000,       // 5 minutos fresh
    gcTime: 15 * 60 * 1000,         // 15 minutos na memória
    retry: 2,
    retryDelay: 1800,
    refetchOnWindowFocus: true,
    maxQueries: 20
  },
  
  // Configurações de campo: Cache médio
  fieldConfig: {
    staleTime: 6 * 60 * 1000,       // 6 minutos fresh
    gcTime: 18 * 60 * 1000,         // 18 minutos na memória
    retry: 2,
    retryDelay: 2000,
    refetchOnWindowFocus: false,
    maxQueries: 10
  },
  
  // Controle de estágios: Cache curto, pode mudar frequentemente
  stageControl: {
    staleTime: 3 * 60 * 1000,       // 3 minutos fresh
    gcTime: 10 * 60 * 1000,         // 10 minutos na memória
    retry: 3,
    retryDelay: 1500,
    refetchOnWindowFocus: true,
    maxQueries: 25
  },
  
  // Analytics: Cache muito curto, dados em tempo real
  analytics: {
    staleTime: 1 * 60 * 1000,       // 1 minuto fresh
    gcTime: 5 * 60 * 1000,          // 5 minutos na memória
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000, // Refetch a cada 2 minutos
    maxQueries: 15
  }
};

// 👥 CLIENTS - Dados estáveis, cache longo
export const clientsCacheConfig: ContextCacheConfig = {
  // Lista de clientes: Cache médio
  list: {
    staleTime: 6 * 60 * 1000,       // 6 minutos fresh
    gcTime: 18 * 60 * 1000,         // 18 minutos na memória
    retry: 2,
    retryDelay: 2000,
    refetchOnWindowFocus: true,
    maxQueries: 20,
    prefetchTime: 3 * 60 * 1000
  },
  
  // Detalhes do cliente: Cache longo, dados estáveis
  details: {
    staleTime: 12 * 60 * 1000,      // 12 minutos fresh
    gcTime: 30 * 60 * 1000,         // 30 minutos na memória
    retry: 2,
    retryDelay: 2500,
    refetchOnWindowFocus: false,     // Detalhes não mudam muito
    maxQueries: 15
  },
  
  // Tags: Cache longo
  tags: {
    staleTime: 15 * 60 * 1000,      // 15 minutos fresh
    gcTime: 35 * 60 * 1000,         // 35 minutos na memória
    retry: 1,
    retryDelay: 3000,
    refetchOnWindowFocus: false,
    maxQueries: 5
  },
  
  // Filtros: Cache muito longo, raramente mudam
  filters: {
    staleTime: 20 * 60 * 1000,      // 20 minutos fresh
    gcTime: 45 * 60 * 1000,         // 45 minutos na memória
    retry: 1,
    retryDelay: 3000,
    refetchOnWindowFocus: false,
    maxQueries: 8
  },
  
  // Deals: Cache médio, dados transacionais
  deals: {
    staleTime: 4 * 60 * 1000,       // 4 minutos fresh
    gcTime: 12 * 60 * 1000,         // 12 minutos na memória
    retry: 3,
    retryDelay: 1500,
    refetchOnWindowFocus: true,
    maxQueries: 20
  },
  
  // WhatsApp: Cache curto, dados dinâmicos
  whatsapp: {
    staleTime: 2 * 60 * 1000,       // 2 minutos fresh
    gcTime: 8 * 60 * 1000,          // 8 minutos na memória
    retry: 3,
    retryDelay: 1200,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    maxQueries: 15
  },
  
  // Analytics: Cache médio
  analytics: {
    staleTime: 5 * 60 * 1000,       // 5 minutos fresh
    gcTime: 15 * 60 * 1000,         // 15 minutos na memória
    retry: 2,
    retryDelay: 2000,
    refetchOnWindowFocus: true,
    maxQueries: 10
  },
  
  // Import/Export: Cache muito curto, progresso em tempo real
  importExport: {
    staleTime: 30 * 1000,           // 30 segundos fresh
    gcTime: 2 * 60 * 1000,          // 2 minutos na memória
    retry: 5,
    retryDelay: 500,
    refetchOnWindowFocus: true,
    refetchInterval: 10 * 1000,     // Refetch a cada 10s para progresso
    maxQueries: 5
  }
};

// 🛡️ ISOLATED CACHE MANAGER
export class IsolatedCacheManager {
  private static instances: Map<string, IsolatedCacheManager> = new Map();
  
  private context: string;
  private queryClient: QueryClient;
  private config: ContextCacheConfig;
  private prefetchTimers: Map<string, NodeJS.Timeout> = new Map();
  private metrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    prefetches: 0
  };

  private constructor(context: string, queryClient: QueryClient) {
    this.context = context;
    this.queryClient = queryClient;
    
    // Selecionar configuração baseada no contexto
    this.config = this.getConfigForContext(context);
    
    // Setup automatic cleanup
    this.setupAutomaticCleanup();
    
    // Setup prefetch timers
    this.setupPrefetchTimers();
    
    console.log(`🗄️ [CacheManager:${context}] Inicializado com estratégias específicas`);
  }

  // 🏭 Factory method
  static getInstance(context: string, queryClient: QueryClient): IsolatedCacheManager {
    if (!this.instances.has(context)) {
      this.instances.set(context, new IsolatedCacheManager(context, queryClient));
    }
    return this.instances.get(context)!;
  }

  // 🎯 Obter configuração específica do contexto
  private getConfigForContext(context: string): ContextCacheConfig {
    const configs = {
      dashboard: dashboardCacheConfig,
      salesfunnel: salesFunnelCacheConfig,
      chat: chatCacheConfig,
      aiagents: aiAgentsCacheConfig,
      clients: clientsCacheConfig
    };
    
    return configs[context as keyof typeof configs] || {};
  }

  // 🔧 Obter estratégia de cache para query type
  getCacheStrategy(queryType: string): CacheStrategy | null {
    return this.config[queryType] || null;
  }

  // ⚡ Aplicar estratégia específica a uma query
  applyStrategy(queryKey: any[], queryType: string): CacheStrategy | null {
    const strategy = this.getCacheStrategy(queryType);
    if (!strategy) return null;

    // Aplicar configurações específicas
    this.queryClient.setQueryDefaults(queryKey, {
      staleTime: strategy.staleTime,
      gcTime: strategy.gcTime,
      retry: strategy.retry,
      retryDelay: strategy.retryDelay,
      refetchOnWindowFocus: strategy.refetchOnWindowFocus,
      refetchOnReconnect: strategy.refetchOnReconnect,
      refetchInterval: strategy.refetchInterval
    });

    console.log(`⚡ [CacheManager:${this.context}] Estratégia aplicada para ${queryType}:`, {
      queryKey: queryKey[0],
      staleTime: strategy.staleTime,
      gcTime: strategy.gcTime
    });

    return strategy;
  }

  // 🧹 Limpeza automática baseada no contexto
  private setupAutomaticCleanup() {
    // Cleanup mais agressivo para chat (dados em tempo real)
    const cleanupInterval = this.context === 'chat' ? 2 * 60 * 1000 : 5 * 60 * 1000;
    
    setInterval(() => {
      this.performCleanup();
    }, cleanupInterval);
  }

  // 🗑️ Executar limpeza
  private performCleanup() {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    let evictedCount = 0;
    
    queries.forEach(query => {
      // Verificar se pertence ao contexto atual
      if (!this.belongsToContext(query.queryKey)) return;
      
      // Verificar se deve ser removida baseado na estratégia
      const queryType = this.getQueryTypeFromKey(query.queryKey);
      const strategy = this.getCacheStrategy(queryType);
      
      if (strategy && this.shouldEvict(query, strategy)) {
        cache.remove(query);
        evictedCount++;
        this.metrics.evictions++;
      }
    });

    if (evictedCount > 0) {
      console.log(`🧹 [CacheManager:${this.context}] Limpeza automática: ${evictedCount} queries removidas`);
    }
  }

  // 🔍 Verificar se query pertence ao contexto
  private belongsToContext(queryKey: any[]): boolean {
    if (!queryKey[0] || typeof queryKey[0] !== 'string') return false;
    
    const key = queryKey[0];
    const contextPrefixes = {
      dashboard: 'dashboard-',
      salesfunnel: 'salesfunnel-', 
      chat: 'chat-',
      aiagents: 'AI_AGENTS-',
      clients: 'CLIENTS_MGMT-'
    };
    
    const prefix = contextPrefixes[this.context as keyof typeof contextPrefixes];
    return prefix ? key.startsWith(prefix) : false;
  }

  // 🏷️ Extrair tipo de query da key
  private getQueryTypeFromKey(queryKey: any[]): string {
    if (!queryKey[1]) return 'default';
    return queryKey[1];
  }

  // 🗑️ Verificar se query deve ser removida
  private shouldEvict(query: any, strategy: CacheStrategy): boolean {
    const now = Date.now();
    const queryAge = now - query.state.dataUpdatedAt;
    const shouldEvict = queryAge > strategy.gcTime;
    
    return shouldEvict;
  }

  // ⏰ Setup de prefetch automático
  private setupPrefetchTimers() {
    Object.entries(this.config).forEach(([queryType, strategy]) => {
      if (strategy.prefetchTime) {
        const timer = setInterval(() => {
          this.performPrefetch(queryType);
        }, strategy.prefetchTime);
        
        this.prefetchTimers.set(queryType, timer);
      }
    });
  }

  // ⚡ Executar prefetch
  private performPrefetch(queryType: string) {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.findAll({
      predicate: (query) => {
        return this.belongsToContext(query.queryKey) && 
               this.getQueryTypeFromKey(query.queryKey) === queryType;
      }
    });

    // Prefetch queries que estão próximas de ficar stale
    queries.forEach(query => {
      const strategy = this.getCacheStrategy(queryType);
      if (!strategy) return;

      const now = Date.now();
      const timeSinceUpdate = now - query.state.dataUpdatedAt;
      const shouldPrefetch = timeSinceUpdate > (strategy.staleTime * 0.8); // 80% do staleTime

      if (shouldPrefetch && query.state.status === 'success') {
        console.log(`⚡ [CacheManager:${this.context}] Prefetch para ${queryType}`);
        this.queryClient.prefetchQuery({
          queryKey: query.queryKey,
          staleTime: strategy.staleTime
        });
        this.metrics.prefetches++;
      }
    });
  }

  // 📊 Obter métricas do cache
  getMetrics() {
    const cache = this.queryClient.getQueryCache();
    const contextQueries = cache.findAll({
      predicate: (query) => this.belongsToContext(query.queryKey)
    });

    return {
      context: this.context,
      totalQueries: contextQueries.length,
      activeTimers: this.prefetchTimers.size,
      ...this.metrics,
      hitRate: this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0,
      queriesByType: this.getQueriesByType(contextQueries),
      memoryUsage: this.estimateMemoryUsage(contextQueries)
    };
  }

  // 📊 Queries por tipo
  private getQueriesByType(queries: any[]) {
    const byType: Record<string, number> = {};
    
    queries.forEach(query => {
      const type = this.getQueryTypeFromKey(query.queryKey);
      byType[type] = (byType[type] || 0) + 1;
    });
    
    return byType;
  }

  // 💾 Estimar uso de memória
  private estimateMemoryUsage(queries: any[]): string {
    const totalSizeBytes = queries.reduce((acc, query) => {
      // Estimativa grosseira baseada no JSON.stringify
      try {
        const size = JSON.stringify(query.state.data || {}).length * 2; // * 2 para UTF-16
        return acc + size;
      } catch {
        return acc + 1000; // Fallback de 1KB
      }
    }, 0);
    
    // Converter para formato legível
    if (totalSizeBytes < 1024) return `${totalSizeBytes}B`;
    if (totalSizeBytes < 1024 * 1024) return `${(totalSizeBytes / 1024).toFixed(1)}KB`;
    return `${(totalSizeBytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  // 🛑 Destruir manager
  destroy() {
    console.log(`🛑 [CacheManager:${this.context}] Destruindo manager`);
    
    // Limpar timers de prefetch
    this.prefetchTimers.forEach(timer => clearInterval(timer));
    this.prefetchTimers.clear();
    
    // Remover instância global
    IsolatedCacheManager.instances.delete(this.context);
  }
}

// 🔧 HOOKS DE CONVENIÊNCIA

export const useDashboardCache = (queryClient: QueryClient) => {
  const manager = IsolatedCacheManager.getInstance('dashboard', queryClient);
  return {
    applyStrategy: manager.applyStrategy.bind(manager),
    getMetrics: manager.getMetrics.bind(manager),
    getCacheStrategy: manager.getCacheStrategy.bind(manager)
  };
};

export const useSalesFunnelCache = (queryClient: QueryClient) => {
  const manager = IsolatedCacheManager.getInstance('salesfunnel', queryClient);
  return {
    applyStrategy: manager.applyStrategy.bind(manager),
    getMetrics: manager.getMetrics.bind(manager),
    getCacheStrategy: manager.getCacheStrategy.bind(manager)
  };
};

export const useChatCache = (queryClient: QueryClient) => {
  const manager = IsolatedCacheManager.getInstance('chat', queryClient);
  return {
    applyStrategy: manager.applyStrategy.bind(manager),
    getMetrics: manager.getMetrics.bind(manager),
    getCacheStrategy: manager.getCacheStrategy.bind(manager)
  };
};

export const useAIAgentsCache = (queryClient: QueryClient) => {
  const manager = IsolatedCacheManager.getInstance('aiagents', queryClient);
  return {
    applyStrategy: manager.applyStrategy.bind(manager),
    getMetrics: manager.getMetrics.bind(manager),
    getCacheStrategy: manager.getCacheStrategy.bind(manager)
  };
};

export const useClientsCache = (queryClient: QueryClient) => {
  const manager = IsolatedCacheManager.getInstance('clients', queryClient);
  return {
    applyStrategy: manager.applyStrategy.bind(manager),
    getMetrics: manager.getMetrics.bind(manager),
    getCacheStrategy: manager.getCacheStrategy.bind(manager)
  };
};

// 🔍 Debug global
export const debugAllCacheManagers = () => {
  console.group('🗄️ All Cache Managers Metrics');
  
  IsolatedCacheManager.instances.forEach((manager, context) => {
    console.log(`${context}:`, manager.getMetrics());
  });
  
  console.groupEnd();
};