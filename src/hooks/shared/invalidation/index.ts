/**
 * 🎯 SISTEMA DE CONTROLE DE INVALIDAÇÃO
 * Evita invalidações durante estados críticos (modais, drag & drop, navegação)
 */

import { queryKeysDebug } from "@/hooks/queryKeys";

// ========================================
// 🛡️ DOM STATE HELPERS
// ========================================

export const domStateHelpers = {
  /**
   * Marcar modal aberto
   */
  markModalOpen: (modalId: string) => {
    document.body.setAttribute('data-modal-open', modalId);
    console.log(`🔒 [InvalidationControl] Modal aberto: ${modalId}`);
  },

  /**
   * Marcar modal fechado
   */
  markModalClosed: (modalId?: string) => {
    document.body.removeAttribute('data-modal-open');
    console.log(`🔓 [InvalidationControl] Modal fechado: ${modalId || 'unknown'}`);
  },

  /**
   * Marcar início de drag
   */
  markDragStart: () => {
    document.body.setAttribute('data-dragging', 'true');
    console.log('🎯 [InvalidationControl] Drag iniciado');
  },

  /**
   * Marcar fim de drag
   */
  markDragEnd: () => {
    document.body.removeAttribute('data-dragging');
    console.log('🎯 [InvalidationControl] Drag finalizado');
  },

  /**
   * Marcar navegação em progresso
   */
  markNavigationStart: () => {
    document.body.setAttribute('data-navigating', 'true');
    console.log('🧭 [InvalidationControl] Navegação iniciada');
  },

  /**
   * Marcar navegação concluída
   */
  markNavigationEnd: () => {
    document.body.removeAttribute('data-navigating');
    console.log('🧭 [InvalidationControl] Navegação concluída');
  },

  /**
   * Verificar estado atual
   */
  getCurrentState: () => {
    return {
      hasOpenModal: document.body.hasAttribute('data-modal-open'),
      modalId: document.body.getAttribute('data-modal-open'),
      isDragging: document.body.hasAttribute('data-dragging'),
      isNavigating: document.body.hasAttribute('data-navigating')
    };
  }
};

// ========================================
// 🚫 INVALIDATION CONTROLLER
// ========================================

export class IsolatedInvalidationController {
  private queuedInvalidations: Array<{
    queryKey: any[];
    options: any;
    timestamp: number;
    context: string;
  }> = [];

  private processingQueue = false;

  /**
   * Verifica se uma invalidação deve ser bloqueada
   */
  shouldBlockInvalidation(queryKey: any[], context?: string): boolean {
    const state = domStateHelpers.getCurrentState();
    
    // Verificar se há modal aberto
    const hasOpenModal = state.hasOpenModal;
    
    // Verificar se há drag em progresso
    const isDragging = state.isDragging;
    
    // Verificar se é durante navegação
    const isNavigating = state.isNavigating;
    
    const reasons = [];
    if (hasOpenModal) reasons.push('modal-open');
    if (isDragging) reasons.push('dragging');
    if (isNavigating) reasons.push('navigating');
    
    const shouldBlock = reasons.length > 0;
    
    if (shouldBlock) {
      console.log(`🚫 [InvalidationControl] Invalidação bloqueada para ${queryKey[0]}:`, {
        queryKey,
        reasons,
        context,
        modalId: state.modalId
      });
    }
    
    return shouldBlock;
  }

  /**
   * Invalidação segura - executa imediatamente ou enfileira
   */
  safeInvalidate(
    queryClient: any, 
    queryKey: any[], 
    options?: any, 
    context = 'unknown'
  ): boolean {
    if (this.shouldBlockInvalidation(queryKey, context)) {
      // Enfileirar para execução posterior
      this.queuedInvalidations.push({
        queryKey,
        options: options || {},
        timestamp: Date.now(),
        context
      });
      
      console.log(`📋 [InvalidationControl] Invalidação enfileirada:`, {
        queryKey: queryKey[0],
        context,
        queueSize: this.queuedInvalidations.length
      });
      
      // Tentar processar a fila em 2 segundos
      setTimeout(() => this.processQueue(queryClient), 2000);
      
      return false;
    }
    
    // Executar imediatamente
    queryClient.invalidateQueries({ queryKey, ...options });
    console.log(`✅ [InvalidationControl] Invalidação executada:`, {
      queryKey: queryKey[0],
      context
    });
    
    return true;
  }

  /**
   * Processar fila de invalidações pendentes
   */
  private processQueue(queryClient: any) {
    if (this.processingQueue || this.queuedInvalidations.length === 0) {
      return;
    }

    this.processingQueue = true;
    console.log(`🔄 [InvalidationControl] Processando fila de ${this.queuedInvalidations.length} invalidações...`);

    const toProcess = [...this.queuedInvalidations];
    this.queuedInvalidations = [];

    toProcess.forEach(item => {
      if (!this.shouldBlockInvalidation(item.queryKey, `${item.context}-queued`)) {
        queryClient.invalidateQueries({ 
          queryKey: item.queryKey, 
          ...item.options 
        });
        console.log(`✅ [InvalidationControl] Invalidação da fila executada:`, {
          queryKey: item.queryKey[0],
          context: item.context,
          age: Date.now() - item.timestamp
        });
      } else {
        // Ainda bloqueada, voltar para a fila
        this.queuedInvalidations.push(item);
      }
    });

    this.processingQueue = false;

    // Se ainda há itens na fila, tentar novamente
    if (this.queuedInvalidations.length > 0) {
      setTimeout(() => this.processQueue(queryClient), 3000);
    }
  }

  /**
   * Limpar fila de invalidações (emergency)
   */
  clearQueue(): number {
    const count = this.queuedInvalidations.length;
    this.queuedInvalidations = [];
    console.log(`🗑️ [InvalidationControl] Fila limpa: ${count} invalidações removidas`);
    return count;
  }

  /**
   * Forçar processamento da fila
   */
  forceProcessQueue(queryClient: any): number {
    const count = this.queuedInvalidations.length;
    console.log(`⚡ [InvalidationControl] Forçando processamento de ${count} invalidações...`);

    const toProcess = [...this.queuedInvalidations];
    this.queuedInvalidations = [];

    toProcess.forEach(item => {
      queryClient.invalidateQueries({ 
        queryKey: item.queryKey, 
        ...item.options 
      });
    });

    return count;
  }

  /**
   * Obter estatísticas da fila
   */
  getQueueStats() {
    const contextCounts: Record<string, number> = {};
    this.queuedInvalidations.forEach(item => {
      contextCounts[item.context] = (contextCounts[item.context] || 0) + 1;
    });

    return {
      total: this.queuedInvalidations.length,
      byContext: contextCounts,
      oldestTimestamp: this.queuedInvalidations.length > 0 
        ? Math.min(...this.queuedInvalidations.map(i => i.timestamp))
        : null
    };
  }
}

// ========================================
// 🎯 CONTEXTO-SPECIFIC INVALIDATION HOOKS
// ========================================

/**
 * Hook para invalidação isolada do Dashboard
 */
export const useDashboardInvalidation = (queryClient: any) => {
  const controller = new IsolatedInvalidationController();

  return {
    safeInvalidate: (queryKey: any[], options?: any) => 
      controller.safeInvalidate(queryClient, queryKey, options, 'dashboard'),
    
    clearQueue: () => controller.clearQueue(),
    forceProcess: () => controller.forceProcessQueue(queryClient),
    getStats: () => controller.getQueueStats()
  };
};

/**
 * Hook para invalidação isolada do Sales Funnel
 */
export const useSalesFunnelInvalidation = (queryClient: any) => {
  const controller = new IsolatedInvalidationController();

  return {
    safeInvalidate: (queryKey: any[], options?: any) => 
      controller.safeInvalidate(queryClient, queryKey, options, 'salesfunnel'),
    
    clearQueue: () => controller.clearQueue(),
    forceProcess: () => controller.forceProcessQueue(queryClient),
    getStats: () => controller.getQueueStats()
  };
};

/**
 * Hook para invalidação isolada do Chat
 */
export const useChatInvalidation = (queryClient: any) => {
  const controller = new IsolatedInvalidationController();

  return {
    safeInvalidate: (queryKey: any[], options?: any) => 
      controller.safeInvalidate(queryClient, queryKey, options, 'chat'),
    
    clearQueue: () => controller.clearQueue(),
    forceProcess: () => controller.forceProcessQueue(queryClient),
    getStats: () => controller.getQueueStats()
  };
};

/**
 * Hook para invalidação isolada dos AI Agents
 */
export const useAIAgentsInvalidation = (queryClient: any) => {
  const controller = new IsolatedInvalidationController();

  return {
    safeInvalidate: (queryKey: any[], options?: any) => 
      controller.safeInvalidate(queryClient, queryKey, options, 'ai_agents'),
    
    clearQueue: () => controller.clearQueue(),
    forceProcess: () => controller.forceProcessQueue(queryClient),
    getStats: () => controller.getQueueStats()
  };
};

/**
 * Hook para invalidação isolada dos Clients
 */
export const useClientsInvalidation = (queryClient: any) => {
  const controller = new IsolatedInvalidationController();

  return {
    safeInvalidate: (queryKey: any[], options?: any) => 
      controller.safeInvalidate(queryClient, queryKey, options, 'clients'),
    
    clearQueue: () => controller.clearQueue(),
    forceProcess: () => controller.forceProcessQueue(queryClient),
    getStats: () => controller.getQueueStats()
  };
};

// ========================================
// 🛡️ GLOBAL INVALIDATION CONTROL
// ========================================

/**
 * Invalidação por namespace com controle
 */
export const invalidateNamespace = (
  queryClient: any, 
  namespace: string, 
  force = false
) => {
  const controller = new IsolatedInvalidationController();
  
  const predicate = (query: any) => {
    const queryNamespace = queryKeysDebug.extractContext(query.queryKey);
    return queryNamespace === namespace;
  };
  
  if (!force && controller.shouldBlockInvalidation(['namespace', namespace], 'namespace')) {
    console.log(`📋 [InvalidationControl] Namespace invalidation enfileirada: ${namespace}`);
    setTimeout(() => {
      queryClient.invalidateQueries({ predicate });
    }, 5000);
    return false;
  }
  
  queryClient.invalidateQueries({ predicate });
  console.log(`✅ [InvalidationControl] Namespace invalidated: ${namespace}`);
  return true;
};

/**
 * Debug e monitoring do sistema de invalidação
 */
export const invalidationDebug = {
  /**
   * Monitor de invalidações em tempo real
   */
  startMonitoring: (queryClient: any, duration = 120000) => {
    console.log(`🔍 [InvalidationControl] Iniciando monitoramento por ${duration/1000}s...`);
    
    const controller = new IsolatedInvalidationController();
    const invalidations: any[] = [];
    const startTime = Date.now();

    const unsubscribe = queryClient.getQueryCache().subscribe((event: any) => {
      if (event.type === 'invalidate') {
        const context = queryKeysDebug.extractContext(event.query.queryKey);
        const blocked = controller.shouldBlockInvalidation(event.query.queryKey, 'monitor');
        
        invalidations.push({
          timestamp: Date.now() - startTime,
          context,
          queryKey: event.query.queryKey,
          blocked,
          state: domStateHelpers.getCurrentState()
        });
      }
    });

    setTimeout(() => {
      unsubscribe();
      
      console.group('📊 [InvalidationControl] Relatório de Monitoramento');
      console.log('Duração:', `${duration / 1000}s`);
      console.log('Total de invalidações:', invalidations.length);
      
      const byContext = invalidations.reduce((acc, inv) => {
        acc[inv.context || 'unknown'] = (acc[inv.context || 'unknown'] || 0) + 1;
        return acc;
      }, {});
      console.log('Por contexto:', byContext);
      
      const blocked = invalidations.filter(inv => inv.blocked);
      console.log('Bloqueadas:', blocked.length);
      
      if (blocked.length > 0) {
        console.log('Razões de bloqueio:', blocked.map(b => b.state));
      }
      
      console.groupEnd();
    }, duration);
  },

  /**
   * Status atual do sistema
   */
  getCurrentStatus: () => {
    const state = domStateHelpers.getCurrentState();
    console.group('🎯 [InvalidationControl] Status Atual');
    console.log('Modal aberto:', state.hasOpenModal, state.modalId);
    console.log('Drag em progresso:', state.isDragging);
    console.log('Navegação em progresso:', state.isNavigating);
    console.groupEnd();
    return state;
  }
};