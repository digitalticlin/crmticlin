/**
 * 🎯 COMPLETE ISOLATION SYSTEM
 * 
 * Sistema completo de isolamento de queries, invalidações e cache
 * para eliminar interferências entre páginas.
 * 
 * INTEGRAÇÃO COMPLETA:
 * - Query Keys isoladas por contexto/namespace
 * - Filtros de dados isolados por página  
 * - Controle de invalidações isolado
 * - Real-time subscriptions com pausa inteligente
 * - Cache strategies específicas por contexto
 * - Sistema de migração gradual
 */

import { QueryClient } from '@tanstack/react-query';

// Importar todos os sistemas isolados
import {
  // Query Keys
  dashboardKPIsQueryKeys,
  dashboardChartsQueryKeys, 
  dashboardConfigQueryKeys,
  salesFunnelFunnelsQueryKeys,
  salesFunnelStagesQueryKeys,
  salesFunnelLeadsQueryKeys,
  salesFunnelTagsQueryKeys,
  salesFunnelDealsQueryKeys,
  salesFunnelAIQueryKeys,
  chatLeadsQueryKeys,
  chatStagesQueryKeys,
  chatContactsQueryKeys, 
  chatMessagesQueryKeys,
  chatClientsQueryKeys,
  aiAgentsQueryKeys,
  aiPromptsQueryKeys,
  aiFieldConfigQueryKeys,
  aiStageControlQueryKeys,
  aiFlowConfigQueryKeys,
  aiAnalyticsQueryKeys,
  clientsListQueryKeys,
  clientsDetailsQueryKeys,
  clientsTagsQueryKeys,
  clientsFiltersQueryKeys,
  clientsDealsQueryKeys,
  clientsWhatsAppQueryKeys,
  clientsImportExportQueryKeys,
  clientsAnalyticsQueryKeys,
  queryKeysIsolation,
  globalCacheStrategies,
  invalidationControl,
  queryKeysDebug
} from '../queryKeys';

import {
  // Filtros Isolados
  useDashboardFilters,
  useSalesFunnelFilters,
  useChatFilters,
  useClientsFilters,
  useAIAgentsFilters,
  filtersCompatibility,
  filtersDebug
} from '../shared/filters';

import {
  // Controle de Invalidação
  IsolatedInvalidationController,
  useInvalidationControl,
  useDashboardInvalidation,
  useSalesFunnelInvalidation,
  useChatInvalidation,
  useAIAgentsInvalidation,
  useClientsInvalidation,
  domStateHelpers
} from '../shared/invalidation';

import {
  // Real-time Isolado
  IsolatedRealtimeManager,
  useDashboardRealtime,
  useSalesFunnelRealtime,
  useChatRealtime,
  useAIAgentsRealtime,
  useClientsRealtime,
  debugAllRealtimeManagers
} from '../shared/realtime';

import {
  // Cache Isolado
  IsolatedCacheManager,
  useDashboardCache,
  useSalesFunnelCache,
  useChatCache,
  useAIAgentsCache,
  useClientsCache,
  dashboardCacheConfig,
  salesFunnelCacheConfig,
  chatCacheConfig,
  aiAgentsCacheConfig,
  clientsCacheConfig,
  debugAllCacheManagers
} from '../shared/cache';

// 🎯 COMPLETE ISOLATION CONTEXT
export interface IsolationContext {
  name: string;
  queryKeys: any;
  filters: any;
  invalidation: any;
  realtime: any;
  cache: any;
  status: 'active' | 'migrating' | 'legacy';
}

// 🏭 ISOLATION SYSTEM MANAGER
export class CompleteIsolationSystem {
  private static instance: CompleteIsolationSystem;
  private queryClient: QueryClient;
  private contexts: Map<string, IsolationContext> = new Map();
  private migrationStatus: Map<string, { 
    phase: 'planning' | 'executing' | 'completed' | 'failed',
    progress: number,
    startTime: number,
    errors: string[]
  }> = new Map();

  private constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.initializeContexts();
    this.setupGlobalMonitoring();
  }

  // 🏭 Singleton factory
  static getInstance(queryClient: QueryClient): CompleteIsolationSystem {
    if (!this.instance) {
      this.instance = new CompleteIsolationSystem(queryClient);
    }
    return this.instance;
  }

  // 🎯 Inicializar todos os contextos isolados
  private initializeContexts() {
    // Dashboard Context
    this.contexts.set('dashboard', {
      name: 'Dashboard',
      queryKeys: {
        kpis: dashboardKPIsQueryKeys,
        charts: dashboardChartsQueryKeys,
        config: dashboardConfigQueryKeys
      },
      filters: useDashboardFilters,
      invalidation: (qc: QueryClient) => useDashboardInvalidation(qc),
      realtime: (qc: QueryClient) => useDashboardRealtime(qc),
      cache: (qc: QueryClient) => useDashboardCache(qc),
      status: 'active'
    });

    // Sales Funnel Context
    this.contexts.set('salesfunnel', {
      name: 'Sales Funnel',
      queryKeys: {
        funnels: salesFunnelFunnelsQueryKeys,
        stages: salesFunnelStagesQueryKeys,
        leads: salesFunnelLeadsQueryKeys,
        tags: salesFunnelTagsQueryKeys,
        deals: salesFunnelDealsQueryKeys,
        ai: salesFunnelAIQueryKeys
      },
      filters: useSalesFunnelFilters,
      invalidation: (qc: QueryClient) => useSalesFunnelInvalidation(qc),
      realtime: (qc: QueryClient) => useSalesFunnelRealtime(qc),
      cache: (qc: QueryClient) => useSalesFunnelCache(qc),
      status: 'active'
    });

    // Chat Context
    this.contexts.set('chat', {
      name: 'Chat/WhatsApp',
      queryKeys: {
        leads: chatLeadsQueryKeys,
        stages: chatStagesQueryKeys,
        contacts: chatContactsQueryKeys,
        messages: chatMessagesQueryKeys,
        clients: chatClientsQueryKeys
      },
      filters: useChatFilters,
      invalidation: (qc: QueryClient) => useChatInvalidation(qc),
      realtime: (qc: QueryClient) => useChatRealtime(qc),
      cache: (qc: QueryClient) => useChatCache(qc),
      status: 'active'
    });

    // AI Agents Context
    this.contexts.set('aiagents', {
      name: 'AI Agents',
      queryKeys: {
        agents: aiAgentsQueryKeys,
        prompts: aiPromptsQueryKeys,
        fieldConfig: aiFieldConfigQueryKeys,
        stageControl: aiStageControlQueryKeys,
        flowConfig: aiFlowConfigQueryKeys,
        analytics: aiAnalyticsQueryKeys
      },
      filters: useAIAgentsFilters,
      invalidation: (qc: QueryClient) => useAIAgentsInvalidation(qc),
      realtime: (qc: QueryClient) => useAIAgentsRealtime(qc),
      cache: (qc: QueryClient) => useAIAgentsCache(qc),
      status: 'active'
    });

    // Clients Context
    this.contexts.set('clients', {
      name: 'Clients Management',
      queryKeys: {
        list: clientsListQueryKeys,
        details: clientsDetailsQueryKeys,
        tags: clientsTagsQueryKeys,
        filters: clientsFiltersQueryKeys,
        deals: clientsDealsQueryKeys,
        whatsapp: clientsWhatsAppQueryKeys,
        importExport: clientsImportExportQueryKeys,
        analytics: clientsAnalyticsQueryKeys
      },
      filters: useClientsFilters,
      invalidation: (qc: QueryClient) => useClientsInvalidation(qc),
      realtime: (qc: QueryClient) => useClientsRealtime(qc),
      cache: (qc: QueryClient) => useClientsCache(qc),
      status: 'active'
    });

    console.log(`🎯 [IsolationSystem] Inicializados ${this.contexts.size} contextos isolados`);
  }

  // 📊 Configurar monitoramento global
  private setupGlobalMonitoring() {
    // Monitor de queries ativas
    setInterval(() => {
      this.monitorSystemHealth();
    }, 60000); // A cada minuto

    // Monitor de interferências cross-context
    setInterval(() => {
      this.detectCrossContextInterference();
    }, 30000); // A cada 30 segundos
  }

  // 🔍 Monitorar saúde do sistema
  private monitorSystemHealth() {
    const health = {
      timestamp: new Date().toISOString(),
      contexts: {} as any,
      globalStats: {
        totalQueries: this.queryClient.getQueryCache().getAll().length,
        memoryUsage: this.estimateMemoryUsage(),
        activeTasks: this.countActiveTasks()
      }
    };

    // Status de cada contexto
    this.contexts.forEach((context, name) => {
      const cacheManager = IsolatedCacheManager.getInstance(name, this.queryClient);
      const realtimeManager = IsolatedRealtimeManager.getInstance(name, this.queryClient);

      health.contexts[name] = {
        status: context.status,
        cache: cacheManager.getMetrics(),
        realtime: realtimeManager.getStatus()
      };
    });

    // Log apenas se há problemas
    if (this.hasHealthIssues(health)) {
      console.warn('⚠️ [IsolationSystem] Problemas de saúde detectados:', health);
    }
  }

  // 🚨 Detectar interferências cross-context
  private detectCrossContextInterference() {
    const activeQueries = this.queryClient.getQueryCache().getAll();
    const interferenceReport: any = {
      crossContextQueries: [],
      legacyQueries: [],
      suspiciousInvalidations: []
    };

    activeQueries.forEach(query => {
      const namespace = queryKeysIsolation.getNamespace(query.queryKey);
      
      // Detectar queries sem namespace (legadas)
      if (namespace === 'UNKNOWN' || namespace === null) {
        interferenceReport.legacyQueries.push({
          queryKey: query.queryKey,
          state: query.state.status,
          lastUpdated: query.state.dataUpdatedAt
        });
      }
    });

    // Log apenas se há interferências
    if (this.hasInterferences(interferenceReport)) {
      console.warn('🚨 [IsolationSystem] Interferências detectadas:', interferenceReport);
    }
  }

  // 🔧 MIGRATION UTILITIES

  // 🔄 Migrar contexto específico
  async migrateContext(contextName: string, options: {
    backup?: boolean,
    dryRun?: boolean,
    forceReplace?: boolean
  } = {}): Promise<boolean> {
    const context = this.contexts.get(contextName);
    if (!context) {
      console.error(`❌ [IsolationSystem] Contexto ${contextName} não encontrado`);
      return false;
    }

    console.log(`🔄 [IsolationSystem] Iniciando migração do contexto ${contextName}`);

    // Inicializar status de migração
    this.migrationStatus.set(contextName, {
      phase: 'planning',
      progress: 0,
      startTime: Date.now(),
      errors: []
    });

    try {
      // Fase 1: Planning (10%)
      await this.planMigration(contextName, options);
      this.updateMigrationProgress(contextName, 'executing', 10);

      // Fase 2: Backup se necessário (20%)
      if (options.backup) {
        await this.backupContext(contextName);
        this.updateMigrationProgress(contextName, 'executing', 20);
      }

      // Fase 3: Aplicar novas query keys (50%)
      await this.applyNewQueryKeys(contextName, options.forceReplace);
      this.updateMigrationProgress(contextName, 'executing', 50);

      // Fase 4: Migrar real-time subscriptions (70%)
      await this.migrateRealtimeSubscriptions(contextName);
      this.updateMigrationProgress(contextName, 'executing', 70);

      // Fase 5: Aplicar cache strategies (85%)
      await this.applyCacheStrategies(contextName);
      this.updateMigrationProgress(contextName, 'executing', 85);

      // Fase 6: Validar migração (100%)
      const isValid = await this.validateMigration(contextName);
      if (isValid) {
        this.updateMigrationProgress(contextName, 'completed', 100);
        context.status = 'active';
        console.log(`✅ [IsolationSystem] Migração do contexto ${contextName} concluída com sucesso`);
        return true;
      } else {
        throw new Error('Validação da migração falhou');
      }

    } catch (error) {
      console.error(`❌ [IsolationSystem] Erro na migração do contexto ${contextName}:`, error);
      this.updateMigrationProgress(contextName, 'failed', -1);
      return false;
    }
  }

  // 📋 Planejar migração
  private async planMigration(contextName: string, options: any): Promise<void> {
    console.log(`📋 [IsolationSystem] Planejando migração para ${contextName}`);
    
    // Verificar queries ativas do contexto
    const activeQueries = this.queryClient.getQueryCache().findAll({
      predicate: (query) => queryKeysIsolation.belongsTo[contextName as keyof typeof queryKeysIsolation.belongsTo]?.(query.queryKey)
    });

    console.log(`📋 [IsolationSystem] Encontradas ${activeQueries.length} queries ativas para migração`);
  }

  // 💾 Backup do contexto
  private async backupContext(contextName: string): Promise<void> {
    console.log(`💾 [IsolationSystem] Criando backup para ${contextName}`);
    
    // Implementar backup se necessário
    // Por enquanto, apenas log
  }

  // 🔄 Aplicar novas query keys
  private async applyNewQueryKeys(contextName: string, forceReplace = false): Promise<void> {
    console.log(`🔄 [IsolationSystem] Aplicando novas query keys para ${contextName}`);
    
    const context = this.contexts.get(contextName);
    if (!context) return;

    // Invalidar queries antigas se forceReplace
    if (forceReplace) {
      const legacyQueries = this.queryClient.getQueryCache().findAll({
        predicate: (query) => !queryKeysIsolation.getNamespace(query.queryKey)
      });

      legacyQueries.forEach(query => {
        this.queryClient.removeQueries({ queryKey: query.queryKey });
      });
    }
  }

  // 📡 Migrar real-time subscriptions
  private async migrateRealtimeSubscriptions(contextName: string): Promise<void> {
    console.log(`📡 [IsolationSystem] Migrando real-time subscriptions para ${contextName}`);
    
    // Implementar migração de subscriptions
    // Por enquanto, apenas log
  }

  // 🗄️ Aplicar cache strategies
  private async applyCacheStrategies(contextName: string): Promise<void> {
    console.log(`🗄️ [IsolationSystem] Aplicando cache strategies para ${contextName}`);
    
    const cacheManager = IsolatedCacheManager.getInstance(contextName, this.queryClient);
    
    // Aplicar estratégias baseadas no contexto
    // Por enquanto, já está sendo feito automaticamente
  }

  // ✅ Validar migração
  private async validateMigration(contextName: string): Promise<boolean> {
    console.log(`✅ [IsolationSystem] Validando migração para ${contextName}`);
    
    // Verificar se não há interferências
    const hasInterferences = this.detectContextInterferences(contextName);
    
    return !hasInterferences;
  }

  // 🚨 Detectar interferências específicas do contexto
  private detectContextInterferences(contextName: string): boolean {
    const queries = this.queryClient.getQueryCache().getAll();
    
    // Procurar por queries do contexto que não seguem o padrão isolado
    const problematicQueries = queries.filter(query => {
      const namespace = queryKeysIsolation.getNamespace(query.queryKey);
      const expectedNamespace = this.getExpectedNamespace(contextName);
      
      // Se é query do contexto mas não tem o namespace correto
      return this.belongsToContext(query.queryKey, contextName) && 
             namespace !== expectedNamespace;
    });

    if (problematicQueries.length > 0) {
      console.warn(`🚨 [IsolationSystem] Encontradas ${problematicQueries.length} queries problemáticas em ${contextName}`);
      return true;
    }

    return false;
  }

  // 🏷️ Obter namespace esperado
  private getExpectedNamespace(contextName: string): string {
    const mapping = {
      dashboard: 'DASHBOARD',
      salesfunnel: 'SALES_FUNNEL',
      chat: 'CHAT_WHATSAPP', 
      aiagents: 'AI_AGENTS',
      clients: 'CLIENTS_MGMT'
    };
    
    return mapping[contextName as keyof typeof mapping] || 'UNKNOWN';
  }

  // 🔍 Verificar se query pertence ao contexto
  private belongsToContext(queryKey: any[], contextName: string): boolean {
    return queryKeysIsolation.belongsTo[contextName as keyof typeof queryKeysIsolation.belongsTo]?.(queryKey) || false;
  }

  // 📊 Atualizar progresso da migração
  private updateMigrationProgress(contextName: string, phase: any, progress: number) {
    const status = this.migrationStatus.get(contextName);
    if (status) {
      status.phase = phase;
      status.progress = progress;
      
      console.log(`📊 [IsolationSystem] Migração ${contextName}: ${phase} (${progress}%)`);
    }
  }

  // 🔍 Verificar problemas de saúde
  private hasHealthIssues(health: any): boolean {
    // Implementar verificações de saúde
    return false; // Por enquanto, sem problemas
  }

  // 🚨 Verificar interferências
  private hasInterferences(report: any): boolean {
    return report.legacyQueries.length > 0 || 
           report.crossContextQueries.length > 0 ||
           report.suspiciousInvalidations.length > 0;
  }

  // 💾 Estimar uso de memória
  private estimateMemoryUsage(): string {
    const queries = this.queryClient.getQueryCache().getAll();
    const totalSize = queries.reduce((acc, query) => {
      try {
        return acc + JSON.stringify(query.state.data || {}).length * 2;
      } catch {
        return acc + 1000;
      }
    }, 0);

    if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(1)}KB`;
    return `${(totalSize / (1024 * 1024)).toFixed(1)}MB`;
  }

  // 📊 Contar tarefas ativas
  private countActiveTasks(): number {
    // Contar managers ativos
    return IsolatedCacheManager.instances?.size + 
           IsolatedRealtimeManager.instances?.size;
  }

  // 📊 UTILITY METHODS

  // Obter contexto
  getContext(name: string): IsolationContext | undefined {
    return this.contexts.get(name);
  }

  // Listar todos os contextos
  getAllContexts(): IsolationContext[] {
    return Array.from(this.contexts.values());
  }

  // Status de migração
  getMigrationStatus(contextName: string) {
    return this.migrationStatus.get(contextName);
  }

  // Debug completo do sistema
  getSystemStatus() {
    return {
      contexts: Array.from(this.contexts.keys()),
      activeManagers: {
        cache: IsolatedCacheManager.instances?.size || 0,
        realtime: IsolatedRealtimeManager.instances?.size || 0
      },
      queryCache: {
        totalQueries: this.queryClient.getQueryCache().getAll().length,
        memoryUsage: this.estimateMemoryUsage()
      },
      migrations: Object.fromEntries(this.migrationStatus)
    };
  }
}

// 🔧 MAIN INTEGRATION HOOKS

// Hook principal para usar isolamento em qualquer contexto
export const useIsolatedContext = (contextName: string, queryClient: QueryClient) => {
  const system = CompleteIsolationSystem.getInstance(queryClient);
  const context = system.getContext(contextName);
  
  if (!context) {
    throw new Error(`Contexto de isolamento '${contextName}' não encontrado`);
  }

  return {
    queryKeys: context.queryKeys,
    filters: context.filters(),
    invalidation: context.invalidation(queryClient),
    realtime: context.realtime(queryClient),
    cache: context.cache(queryClient),
    migrate: () => system.migrateContext(contextName),
    status: context.status
  };
};

// Hooks específicos por contexto (para conveniência)
export const useDashboardIsolation = (queryClient: QueryClient) => 
  useIsolatedContext('dashboard', queryClient);

export const useSalesFunnelIsolation = (queryClient: QueryClient) => 
  useIsolatedContext('salesfunnel', queryClient);

export const useChatIsolation = (queryClient: QueryClient) => 
  useIsolatedContext('chat', queryClient);

export const useAIAgentsIsolation = (queryClient: QueryClient) => 
  useIsolatedContext('aiagents', queryClient);

export const useClientsIsolation = (queryClient: QueryClient) => 
  useIsolatedContext('clients', queryClient);

// 🔍 Debug helpers globais
export const debugCompleteIsolationSystem = (queryClient: QueryClient) => {
  const system = CompleteIsolationSystem.getInstance(queryClient);
  
  console.group('🎯 Complete Isolation System Status');
  console.log('System Status:', system.getSystemStatus());
  console.groupEnd();
  
  // Debug subsistemas
  debugAllCacheManagers();
  debugAllRealtimeManagers();
  queryKeysDebug.logIsolationStatus(queryClient);
};

// 🚀 Inicialização rápida do sistema completo
export const initializeIsolationSystem = (queryClient: QueryClient) => {
  const system = CompleteIsolationSystem.getInstance(queryClient);
  
  console.log('🚀 [IsolationSystem] Sistema de isolamento completo inicializado');
  console.log('📊 Contextos disponíveis:', system.getAllContexts().map(c => c.name));
  
  // Marcar DOM helpers como disponíveis
  (window as any).isolationHelpers = {
    domStateHelpers,
    debugSystem: () => debugCompleteIsolationSystem(queryClient),
    migrateAll: async () => {
      const contexts = ['dashboard', 'salesfunnel', 'chat', 'aiagents', 'clients'];
      for (const context of contexts) {
        await system.migrateContext(context);
      }
    }
  };
  
  return system;
};

// 🎯 Export principal para uso direto
export default CompleteIsolationSystem;