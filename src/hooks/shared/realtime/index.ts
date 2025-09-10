/**
 * 🔄 ISOLATED REAL-TIME SUBSCRIPTION MANAGER
 * 
 * Sistema para controlar subscriptions em tempo real de forma isolada,
 * evitando que real-time de uma página afete outras páginas.
 * 
 * PRINCIPAIS FUNCIONALIDADES:
 * - Pausar subscriptions durante operações críticas
 * - Isolamento por contexto/namespace  
 * - Debounce inteligente de invalidações
 * - Reconexão automática após pausa
 * - Queue de eventos perdidos durante pausa
 */

import { supabase } from '@/integrations/supabase/client';
import { QueryClient } from '@tanstack/react-query';
import { RealtimeChannel } from '@supabase/supabase-js';

// 🎯 Real-time Event Types
interface RealtimeEvent {
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  old?: any;
  new?: any;
  timestamp: number;
  context: string;
}

// 🛡️ ISOLATED REAL-TIME MANAGER
export class IsolatedRealtimeManager {
  private static instances: Map<string, IsolatedRealtimeManager> = new Map();
  
  private context: string;
  private queryClient: QueryClient;
  private channels: Map<string, RealtimeChannel> = new Map();
  private isPaused = false;
  private eventQueue: RealtimeEvent[] = [];
  private pauseReasons = new Set<string>();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  // Configurações por contexto
  private config = {
    dashboard: {
      debounceMs: 3000,     // Dashboard não precisa ser tão rápido
      maxQueueSize: 50,
      pauseOnModal: true,
      pauseOnDrag: false,   // Dashboard não tem drag
      pauseOnNavigation: true
    },
    salesfunnel: {
      debounceMs: 1000,     // Sales Funnel precisa ser mais responsivo
      maxQueueSize: 100,
      pauseOnModal: true,   // Crítico: pausar durante modais
      pauseOnDrag: true,    // Crítico: pausar durante drag & drop
      pauseOnNavigation: true
    },
    chat: {
      debounceMs: 500,      // Chat precisa ser muito rápido
      maxQueueSize: 200,
      pauseOnModal: false,  // Chat pode continuar com modal aberto
      pauseOnDrag: false,   // Chat não tem drag
      pauseOnNavigation: false // Chat deve continuar durante navegação
    },
    aiagents: {
      debounceMs: 2000,     // AI Agents menos crítico
      maxQueueSize: 30,
      pauseOnModal: true,
      pauseOnDrag: false,
      pauseOnNavigation: true
    },
    clients: {
      debounceMs: 2000,     // Clientes menos crítico
      maxQueueSize: 75,
      pauseOnModal: true,
      pauseOnDrag: false,
      pauseOnNavigation: true
    }
  };

  private constructor(context: string, queryClient: QueryClient) {
    this.context = context;
    this.queryClient = queryClient;
    
    // Setup automatic state detection
    this.setupStateDetection();
    
    // Cleanup queue periodically
    setInterval(() => this.cleanupQueue(), 60000); // 1 minuto
  }

  // 🏭 Factory method - uma instância por contexto
  static getInstance(context: string, queryClient: QueryClient): IsolatedRealtimeManager {
    if (!this.instances.has(context)) {
      this.instances.set(context, new IsolatedRealtimeManager(context, queryClient));
    }
    return this.instances.get(context)!;
  }

  // 🔍 Detectar estados que devem pausar subscriptions
  private setupStateDetection() {
    // Observar mudanças no DOM para detectar modais, drag, etc.
    const observer = new MutationObserver(() => {
      this.checkPauseConditions();
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-modal-open', 'data-dragging', 'data-navigating']
    });

    // Verificação inicial
    this.checkPauseConditions();
  }

  // ⚡ Verificar condições de pausa
  private checkPauseConditions() {
    const contextConfig = this.config[this.context as keyof typeof this.config];
    if (!contextConfig) return;

    const states = {
      modalOpen: document.querySelector('[data-modal-open]') !== null,
      dragging: document.body.hasAttribute('data-dragging'), 
      navigating: document.body.hasAttribute('data-navigating')
    };

    const shouldPause = 
      (contextConfig.pauseOnModal && states.modalOpen) ||
      (contextConfig.pauseOnDrag && states.dragging) ||
      (contextConfig.pauseOnNavigation && states.navigating);

    if (shouldPause && !this.isPaused) {
      const reasons = [];
      if (contextConfig.pauseOnModal && states.modalOpen) reasons.push('modal');
      if (contextConfig.pauseOnDrag && states.dragging) reasons.push('drag');  
      if (contextConfig.pauseOnNavigation && states.navigating) reasons.push('navigation');
      
      this.pause(`auto-${reasons.join(',')}`);
    } else if (!shouldPause && this.isPaused && this.pauseReasons.size === 1 && Array.from(this.pauseReasons)[0].startsWith('auto-')) {
      this.resume('auto-conditions-cleared');
    }
  }

  // ⏸️ Pausar subscriptions
  pause(reason: string) {
    this.pauseReasons.add(reason);
    
    if (!this.isPaused) {
      this.isPaused = true;
      console.log(`⏸️ [RealtimeManager:${this.context}] Pausando subscriptions: ${reason}`);
      
      // Não desconectar canais, apenas marcar como pausado
      // Os eventos vão para a queue
    }
  }

  // ▶️ Retomar subscriptions
  resume(reason: string) {
    this.pauseReasons.delete(reason);
    
    // Só retomar se não há mais razões para pausa
    if (this.pauseReasons.size === 0 && this.isPaused) {
      this.isPaused = false;
      console.log(`▶️ [RealtimeManager:${this.context}] Retomando subscriptions: ${reason}`);
      
      // Processar eventos em queue
      this.processQueue();
    }
  }

  // 📡 Criar subscription isolada
  createSubscription(
    table: string,
    filter: string,
    onEvent: (event: RealtimeEvent) => void,
    channelId?: string
  ): string {
    const id = channelId || `${this.context}-${table}-${Date.now()}`;
    
    console.log(`📡 [RealtimeManager:${this.context}] Criando subscription ${id} para tabela ${table}`);

    const channel = supabase
      .channel(`${this.context}-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter
        },
        (payload) => {
          const realtimeEvent: RealtimeEvent = {
            event: payload.eventType as any,
            table: payload.table,
            schema: payload.schema,
            old: payload.old,
            new: payload.new,
            timestamp: Date.now(),
            context: this.context
          };

          this.handleRealtimeEvent(realtimeEvent, onEvent);
        }
      )
      .subscribe();

    this.channels.set(id, channel);
    return id;
  }

  // 🎯 Processar evento de real-time
  private handleRealtimeEvent(
    event: RealtimeEvent, 
    onEvent: (event: RealtimeEvent) => void
  ) {
    if (this.isPaused) {
      // Se pausado, adicionar à queue
      this.addToQueue(event);
      return;
    }

    // Se não pausado, processar com debounce
    this.debouncedProcess(event, onEvent);
  }

  // 📋 Adicionar evento à queue
  private addToQueue(event: RealtimeEvent) {
    const contextConfig = this.config[this.context as keyof typeof this.config];
    const maxQueueSize = contextConfig?.maxQueueSize || 50;

    this.eventQueue.push(event);
    
    // Limitar tamanho da queue
    if (this.eventQueue.length > maxQueueSize) {
      const removed = this.eventQueue.splice(0, this.eventQueue.length - maxQueueSize);
      console.warn(`⚠️ [RealtimeManager:${this.context}] Queue overflow: removidos ${removed.length} eventos antigos`);
    }

    console.log(`📋 [RealtimeManager:${this.context}] Evento adicionado à queue (${this.eventQueue.length} total):`, {
      table: event.table,
      event: event.event
    });
  }

  // ⏱️ Processar com debounce
  private debouncedProcess(event: RealtimeEvent, onEvent: (event: RealtimeEvent) => void) {
    const contextConfig = this.config[this.context as keyof typeof this.config];
    const debounceMs = contextConfig?.debounceMs || 1000;
    const debounceKey = `${event.table}-${event.event}`;

    // Limpar timer anterior se existir
    const existingTimer = this.debounceTimers.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Criar novo timer
    const timer = setTimeout(() => {
      console.log(`⚡ [RealtimeManager:${this.context}] Processando evento debounced:`, {
        table: event.table,
        event: event.event,
        debounceMs
      });
      
      onEvent(event);
      this.debounceTimers.delete(debounceKey);
    }, debounceMs);

    this.debounceTimers.set(debounceKey, timer);
  }

  // ⚡ Processar queue de eventos
  private processQueue() {
    if (this.eventQueue.length === 0) return;

    console.log(`⚡ [RealtimeManager:${this.context}] Processando ${this.eventQueue.length} eventos da queue`);

    // Agrupar eventos por tabela e tipo
    const groupedEvents = this.eventQueue.reduce((acc, event) => {
      const key = `${event.table}-${event.event}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {} as Record<string, RealtimeEvent[]>);

    // Processar apenas o evento mais recente de cada grupo
    Object.entries(groupedEvents).forEach(([key, events]) => {
      const latestEvent = events[events.length - 1];
      console.log(`⚡ [RealtimeManager:${this.context}] Processando evento mais recente de ${key}`);
      
      // Triggerar invalidação baseada no evento
      this.triggerInvalidationForEvent(latestEvent);
    });

    // Limpar queue
    this.eventQueue = [];
  }

  // 🎯 Triggerar invalidação baseada no evento
  private triggerInvalidationForEvent(event: RealtimeEvent) {
    // Mapping de tabelas para query keys do contexto
    const tableToQueryKeys: Record<string, (event: RealtimeEvent) => any[]> = {
      leads: (e) => this.getLeadsQueryKeys(e),
      funnels: (e) => this.getFunnelsQueryKeys(e),
      kanban_stages: (e) => this.getStagesQueryKeys(e),
      ai_agents: (e) => this.getAIAgentsQueryKeys(e),
      whatsapp_messages: (e) => this.getMessagesQueryKeys(e)
    };

    const getQueryKeys = tableToQueryKeys[event.table];
    if (!getQueryKeys) return;

    const queryKeysToInvalidate = getQueryKeys(event);
    
    queryKeysToInvalidate.forEach(queryKey => {
      console.log(`🔄 [RealtimeManager:${this.context}] Invalidando query:`, queryKey);
      this.queryClient.invalidateQueries({ queryKey });
    });
  }

  // 🗂️ Query keys específicos por tabela e contexto
  private getLeadsQueryKeys(event: RealtimeEvent): any[] {
    const keys = [];
    
    switch (this.context) {
      case 'salesfunnel':
        keys.push(['salesfunnel-leads', 'by-funnel']);
        break;
      case 'clients':  
        keys.push(['CLIENTS_MGMT-list']);
        break;
      case 'chat':
        keys.push(['chat-leads']);
        break;
    }
    
    return keys;
  }

  private getFunnelsQueryKeys(event: RealtimeEvent): any[] {
    const keys = [];
    
    switch (this.context) {
      case 'dashboard':
        keys.push(['dashboard-charts', 'funnel-data']);
        break;
      case 'salesfunnel':
        keys.push(['salesfunnel-funnels']);
        break;
    }
    
    return keys;
  }

  private getStagesQueryKeys(event: RealtimeEvent): any[] {
    return [['salesfunnel-stages']]; // Apenas sales funnel usa stages
  }

  private getAIAgentsQueryKeys(event: RealtimeEvent): any[] {
    return [['AI_AGENTS-agents']]; // Apenas AI Agents
  }

  private getMessagesQueryKeys(event: RealtimeEvent): any[] {
    return [['chat-messages']]; // Apenas Chat
  }

  // 🗑️ Remover subscription
  removeSubscription(id: string) {
    const channel = this.channels.get(id);
    if (channel) {
      console.log(`🗑️ [RealtimeManager:${this.context}] Removendo subscription ${id}`);
      supabase.removeChannel(channel);
      this.channels.delete(id);
    }
  }

  // 🧹 Limpeza de queue (remover eventos antigos)
  private cleanupQueue() {
    const maxAge = 300000; // 5 minutos
    const now = Date.now();
    const initialLength = this.eventQueue.length;

    this.eventQueue = this.eventQueue.filter(
      event => now - event.timestamp < maxAge
    );

    const removed = initialLength - this.eventQueue.length;
    if (removed > 0) {
      console.log(`🧹 [RealtimeManager:${this.context}] Removidos ${removed} eventos antigos da queue`);
    }
  }

  // 📊 Status do manager
  getStatus() {
    return {
      context: this.context,
      isPaused: this.isPaused,
      pauseReasons: Array.from(this.pauseReasons),
      activeChannels: this.channels.size,
      queueLength: this.eventQueue.length,
      activeDebounceTimers: this.debounceTimers.size,
      config: this.config[this.context as keyof typeof this.config]
    };
  }

  // 🛑 Destruir manager (cleanup)
  destroy() {
    console.log(`🛑 [RealtimeManager:${this.context}] Destruindo manager`);
    
    // Remover todas as subscriptions
    this.channels.forEach((channel, id) => {
      this.removeSubscription(id);
    });
    
    // Limpar timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    // Limpar queue
    this.eventQueue = [];
    
    // Remover da instância global
    IsolatedRealtimeManager.instances.delete(this.context);
  }
}

// 🔧 HOOKS DE CONVENIÊNCIA POR CONTEXTO

export const useDashboardRealtime = (queryClient: QueryClient) => {
  const manager = IsolatedRealtimeManager.getInstance('dashboard', queryClient);
  
  return {
    createSubscription: manager.createSubscription.bind(manager),
    removeSubscription: manager.removeSubscription.bind(manager),
    pause: manager.pause.bind(manager),
    resume: manager.resume.bind(manager),
    getStatus: manager.getStatus.bind(manager)
  };
};

export const useSalesFunnelRealtime = (queryClient: QueryClient) => {
  const manager = IsolatedRealtimeManager.getInstance('salesfunnel', queryClient);
  
  return {
    createSubscription: manager.createSubscription.bind(manager),
    removeSubscription: manager.removeSubscription.bind(manager), 
    pause: manager.pause.bind(manager),
    resume: manager.resume.bind(manager),
    getStatus: manager.getStatus.bind(manager)
  };
};

export const useChatRealtime = (queryClient: QueryClient) => {
  const manager = IsolatedRealtimeManager.getInstance('chat', queryClient);
  
  return {
    createSubscription: manager.createSubscription.bind(manager),
    removeSubscription: manager.removeSubscription.bind(manager),
    pause: manager.pause.bind(manager),
    resume: manager.resume.bind(manager),
    getStatus: manager.getStatus.bind(manager)
  };
};

export const useAIAgentsRealtime = (queryClient: QueryClient) => {
  const manager = IsolatedRealtimeManager.getInstance('aiagents', queryClient);
  
  return {
    createSubscription: manager.createSubscription.bind(manager),
    removeSubscription: manager.removeSubscription.bind(manager),
    pause: manager.pause.bind(manager),
    resume: manager.resume.bind(manager),
    getStatus: manager.getStatus.bind(manager)
  };
};

export const useClientsRealtime = (queryClient: QueryClient) => {
  const manager = IsolatedRealtimeManager.getInstance('clients', queryClient);
  
  return {
    createSubscription: manager.createSubscription.bind(manager),
    removeSubscription: manager.removeSubscription.bind(manager),
    pause: manager.pause.bind(manager),
    resume: manager.resume.bind(manager),
    getStatus: manager.getStatus.bind(manager)
  };
};

// 🔍 Debug global de todos os managers
export const debugAllRealtimeManagers = () => {
  console.group('🔍 All Realtime Managers Status');
  
  IsolatedRealtimeManager.instances.forEach((manager, context) => {
    console.log(`${context}:`, manager.getStatus());
  });
  
  console.groupEnd();
};