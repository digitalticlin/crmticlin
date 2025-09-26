/**
 * 🎯 SALES FUNNEL COORDINATOR
 *
 * Este é o "gerente de salão" que organiza todos os módulos
 * sem ser um estado global. É apenas um organizador de eventos.
 */

import { useCallback, useRef, useState } from 'react';

export type EventType =
  | 'dnd:start' | 'dnd:move' | 'dnd:end'
  | 'selection:add' | 'selection:remove' | 'selection:clear'
  | 'filter:apply' | 'filter:clear'
  | 'realtime:update' | 'realtime:patch'
  | 'scroll:load-more';

export interface FunnelEvent {
  type: EventType;
  payload: any;
  priority: 'immediate' | 'high' | 'normal' | 'low';
  timestamp: number;
  source: string;
}

export interface CoordinatorState {
  isProcessingDnD: boolean;
  isSelectionMode: boolean;
  hasActiveFilters: boolean;
  isLoadingMore: boolean;
}

/**
 * Hook coordenador que organiza todos os eventos sem conflitos
 */
export const useSalesFunnelCoordinator = () => {
  const [state, setState] = useState<CoordinatorState>({
    isProcessingDnD: false,
    isSelectionMode: false,
    hasActiveFilters: false,
    isLoadingMore: false
  });

  const eventQueue = useRef<FunnelEvent[]>([]);
  const listeners = useRef<Map<EventType, Set<(event: FunnelEvent) => void>>>(new Map());

  // Throttle para evitar event spam
  const lastEventTime = useRef<Record<string, number>>({});
  const EVENT_THROTTLE_MS = 50; // 50ms entre eventos do mesmo tipo

  // Emit event com organização automática e throttling
  const emit = useCallback((event: Omit<FunnelEvent, 'timestamp'>) => {
    const now = Date.now();
    const eventKey = `${event.type}:${event.source}`;

    // Throttle: evitar spam do mesmo evento
    if (lastEventTime.current[eventKey] &&
        now - lastEventTime.current[eventKey] < EVENT_THROTTLE_MS) {
      return; // Ignorar evento duplicado
    }

    lastEventTime.current[eventKey] = now;

    // 🚨 EMERGENCY DOWNGRADE: Forçar priority normal para eventos de filtro
    let priority = event.priority;
    if (event.type.includes('filter')) {
      priority = 'normal';
      console.log('[Coordinator] 🚨 EMERGENCY: Forçando priority normal para', event.type);
    }

    const fullEvent: FunnelEvent = {
      ...event,
      priority,
      timestamp: now
    };

    // Log throttlado (apenas eventos relevantes)
    if (event.priority === 'immediate' || event.type.includes('clear') || event.type.includes('end')) {
      console.log(`[Coordinator] 📨 Evento recebido:`, {
        type: event.type,
        source: event.source,
        priority: event.priority
      });
    }

    // Decidir se processar imediatamente ou enfileirar
    if (event.priority === 'immediate') {
      processEvent(fullEvent);
    } else {
      eventQueue.current.push(fullEvent);
      // Processar fila ordenada por prioridade
      processQueue();
    }
  }, []);

  // Throttle para logs (evitar spam)
  const lastLogRef = useRef<Record<string, number>>({});

  // Processar eventos sem conflitos
  const processEvent = useCallback((event: FunnelEvent) => {
    const now = Date.now();
    const THROTTLE_LOG_MS = 1000; // Log do mesmo tipo apenas a cada 1 segundo

    if (!lastLogRef.current[event.type] || now - lastLogRef.current[event.type] > THROTTLE_LOG_MS) {
      console.log(`[Coordinator] ⚡ Processando evento:`, event.type);
      lastLogRef.current[event.type] = now;
    }

    // Atualizar estado coordenador baseado no evento
    setState(prev => {
      const newState = { ...prev };

      switch (event.type) {
        case 'dnd:start':
          newState.isProcessingDnD = true;
          break;
        case 'dnd:end':
          newState.isProcessingDnD = false;
          break;
        case 'selection:add':
        case 'selection:remove':
          newState.isSelectionMode = true;
          break;
        case 'selection:clear':
          newState.isSelectionMode = false;
          break;
        case 'filter:apply':
          newState.hasActiveFilters = true;
          break;
        case 'filter:clear':
          newState.hasActiveFilters = false;
          break;
        case 'scroll:load-more':
          newState.isLoadingMore = true;
          break;
      }

      return newState;
    });

    // Notificar listeners interessados
    const eventListeners = listeners.current.get(event.type);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(event));
    }
  }, []);

  // Batch processing para reduzir re-renders
  const processBatch = useRef<NodeJS.Timeout>();

  // Processar fila com batching e prioridade
  const processQueue = useCallback(() => {
    if (eventQueue.current.length === 0) return;

    // Cancelar batch anterior se existir
    if (processBatch.current) {
      clearTimeout(processBatch.current);
    }

    // Agrupar eventos similares em batch
    processBatch.current = setTimeout(() => {
      if (eventQueue.current.length === 0) return;

      // Ordenar por prioridade
      const priorityOrder = { immediate: 0, high: 1, normal: 2, low: 3 };
      eventQueue.current.sort((a, b) =>
        priorityOrder[a.priority] - priorityOrder[b.priority]
      );

      // Processar batch de eventos (máximo 3 por vez para evitar sobrecarga)
      const batchSize = Math.min(3, eventQueue.current.length);
      for (let i = 0; i < batchSize; i++) {
        const nextEvent = eventQueue.current.shift();
        if (nextEvent) {
          processEvent(nextEvent);
        }
      }

      // Continuar processando se há mais eventos
      if (eventQueue.current.length > 0) {
        processQueue();
      }
    }, 10); // 10ms batch delay
  }, [processEvent]);

  // Subscribe para eventos específicos
  const subscribe = useCallback((eventType: EventType, callback: (event: FunnelEvent) => void) => {
    if (!listeners.current.has(eventType)) {
      listeners.current.set(eventType, new Set());
    }
    listeners.current.get(eventType)!.add(callback);

    // Retornar função de cleanup
    return () => {
      listeners.current.get(eventType)?.delete(callback);
    };
  }, []);

  // Verificar se ação é permitida (evita conflitos)
  const canExecute = useCallback((action: string): boolean => {
    switch (action) {
      case 'dnd:move':
        // DnD só funciona se não está carregando
        return !state.isLoadingMore;

      case 'selection:multi':
        // Seleção múltipla é sempre permitida
        return true;

      case 'filter:apply':
        // Filtros só se não está processando DnD
        return !state.isProcessingDnD;

      case 'scroll:infinite':
        // Scroll só se não tem filtros ativos
        return !state.hasActiveFilters;

      default:
        return true;
    }
  }, [state]);

  // Log removido - causava loops de re-render

  return {
    state,
    emit,
    subscribe,
    canExecute
  };
};