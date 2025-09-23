/**
 * 🎯 WHATSAPP CHAT COORDINATOR
 *
 * Hook coordenador central inspirado no Sales Funnel
 * Gerencia eventos e comunicação entre módulos isolados
 */

import { useCallback, useRef, useState } from 'react';

interface WhatsAppChatEvent {
  type: 'contact:update' | 'message:new' | 'message:read' | 'instance:change' | 'filter:change' | 'realtime:connect' | 'realtime:disconnect';
  payload: any;
  priority: 'immediate' | 'high' | 'normal' | 'low';
  source: string;
  timestamp?: number;
}

interface UseWhatsAppChatCoordinatorReturn {
  emit: (event: WhatsAppChatEvent) => void;
  subscribe: (eventType: string, callback: (event: WhatsAppChatEvent) => void) => () => void;
  getStats: () => {
    totalEvents: number;
    eventsByType: Record<string, number>;
    activeSubscriptions: number;
    lastEvent: WhatsAppChatEvent | null;
  };
}

export const useWhatsAppChatCoordinator = (): UseWhatsAppChatCoordinatorReturn => {
  console.log('[WhatsApp Chat Coordinator] 🎯 Hook coordenador inicializado');

  // Estados para estatísticas
  const [totalEvents, setTotalEvents] = useState(0);
  const [eventsByType, setEventsByType] = useState<Record<string, number>>({});
  const [lastEvent, setLastEvent] = useState<WhatsAppChatEvent | null>(null);

  // Refs para gerenciamento
  const subscribersRef = useRef<Map<string, Set<(event: WhatsAppChatEvent) => void>>>(new Map());
  const eventQueueRef = useRef<WhatsAppChatEvent[]>([]);
  const processingRef = useRef(false);

  // Processar fila de eventos por prioridade
  const processEventQueue = useCallback(() => {
    if (processingRef.current || eventQueueRef.current.length === 0) return;

    processingRef.current = true;

    // Ordenar por prioridade
    const priorityOrder = { immediate: 0, high: 1, normal: 2, low: 3 };
    eventQueueRef.current.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    while (eventQueueRef.current.length > 0) {
      const event = eventQueueRef.current.shift();
      if (!event) break;

      const subscribers = subscribersRef.current.get(event.type);
      if (subscribers && subscribers.size > 0) {
        console.log(`[WhatsApp Chat Coordinator] 📡 Emitindo evento ${event.type} para ${subscribers.size} subscribers`, {
          priority: event.priority,
          source: event.source,
          hasPayload: !!event.payload
        });

        // Executar callbacks dos subscribers
        subscribers.forEach(callback => {
          try {
            callback(event);
          } catch (error) {
            console.error(`[WhatsApp Chat Coordinator] ❌ Erro ao processar evento ${event.type}:`, error);
          }
        });
      }

      // Atualizar estatísticas
      setTotalEvents(prev => prev + 1);
      setEventsByType(prev => ({
        ...prev,
        [event.type]: (prev[event.type] || 0) + 1
      }));
      setLastEvent(event);
    }

    processingRef.current = false;
  }, []);

  // Emitir evento
  const emit = useCallback((event: WhatsAppChatEvent) => {
    const enrichedEvent = {
      ...event,
      timestamp: Date.now()
    };

    console.log(`[WhatsApp Chat Coordinator] 🚀 Evento ${event.type} adicionado à fila`, {
      priority: event.priority,
      source: event.source,
      queueSize: eventQueueRef.current.length + 1
    });

    eventQueueRef.current.push(enrichedEvent);

    // Processar imediatamente ou agendar
    if (event.priority === 'immediate') {
      processEventQueue();
    } else {
      // Usar setTimeout para permitir batching
      setTimeout(processEventQueue, event.priority === 'high' ? 0 : 10);
    }
  }, [processEventQueue]);

  // Subscrever a eventos
  const subscribe = useCallback((eventType: string, callback: (event: WhatsAppChatEvent) => void) => {
    console.log(`[WhatsApp Chat Coordinator] 📻 Nova subscription para ${eventType}`);

    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set());
    }

    const subscribers = subscribersRef.current.get(eventType)!;
    subscribers.add(callback);

    // Retornar função de cleanup
    return () => {
      console.log(`[WhatsApp Chat Coordinator] 📻 Removendo subscription para ${eventType}`);
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        subscribersRef.current.delete(eventType);
      }
    };
  }, []);

  // Obter estatísticas
  const getStats = useCallback(() => {
    const activeSubscriptions = Array.from(subscribersRef.current.values())
      .reduce((total, subscribers) => total + subscribers.size, 0);

    return {
      totalEvents,
      eventsByType,
      activeSubscriptions,
      lastEvent
    };
  }, [totalEvents, eventsByType, lastEvent]);

  return {
    emit,
    subscribe,
    getStats
  };
};