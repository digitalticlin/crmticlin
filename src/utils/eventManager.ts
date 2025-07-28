/**
 * ✅ SISTEMA DE GERENCIAMENTO DE EVENTOS ANTI-MEMORY LEAK
 * Centraliza e facilita o cleanup de event listeners
 */

import { logger } from './logger';

type EventCallback = (...args: any[]) => void;

interface EventSubscription {
  id: string;
  eventName: string;
  callback: EventCallback;
  target: EventTarget;
  cleanup: () => void;
}

class EventManager {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private subscriptionCounter = 0;

  // ✅ ADICIONAR EVENT LISTENER COM CLEANUP AUTOMÁTICO
  addEventListener(
    target: EventTarget, 
    eventName: string, 
    callback: EventCallback,
    options?: AddEventListenerOptions
  ): string {
    const id = `event_${++this.subscriptionCounter}`;
    
    // Wrapper que adiciona logging e controle
    const wrappedCallback = (...args: any[]) => {
      try {
        callback(...args);
      } catch (error) {
        logger.error(`Erro no event listener ${eventName}:`, error);
      }
    };
    
    target.addEventListener(eventName, wrappedCallback, options);
    
    const subscription: EventSubscription = {
      id,
      eventName,
      callback: wrappedCallback,
      target,
      cleanup: () => {
        target.removeEventListener(eventName, wrappedCallback);
        logger.debug(`Event listener removido: ${eventName}`);
      }
    };
    
    this.subscriptions.set(id, subscription);
    logger.debug(`Event listener adicionado: ${eventName} (ID: ${id})`);
    
    return id;
  }

  // ✅ REMOVER EVENT LISTENER ESPECÍFICO
  removeEventListener(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      logger.warn(`Subscription não encontrada: ${subscriptionId}`);
      return false;
    }

    subscription.cleanup();
    this.subscriptions.delete(subscriptionId);
    return true;
  }

  // ✅ REMOVER TODOS OS LISTENERS DE UM EVENTO
  removeEventListenersByName(eventName: string): number {
    let removedCount = 0;
    
    for (const [id, subscription] of this.subscriptions.entries()) {
      if (subscription.eventName === eventName) {
        subscription.cleanup();
        this.subscriptions.delete(id);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      logger.debug(`Removidos ${removedCount} listeners do evento: ${eventName}`);
    }
    
    return removedCount;
  }

  // ✅ CLEANUP COMPLETO (para unmount de componentes)
  removeAllEventListeners(): number {
    const count = this.subscriptions.size;
    
    for (const subscription of this.subscriptions.values()) {
      subscription.cleanup();
    }
    
    this.subscriptions.clear();
    
    if (count > 0) {
      logger.debug(`Cleanup completo: ${count} event listeners removidos`);
    }
    
    return count;
  }

  // ✅ ESTATÍSTICAS PARA DEBUG
  getStats() {
    const eventCounts: Record<string, number> = {};
    
    for (const subscription of this.subscriptions.values()) {
      eventCounts[subscription.eventName] = (eventCounts[subscription.eventName] || 0) + 1;
    }
    
    return {
      totalSubscriptions: this.subscriptions.size,
      eventCounts,
      subscriptionIds: Array.from(this.subscriptions.keys())
    };
  }

  // ✅ VERIFICAÇÃO DE MEMORY LEAKS
  checkForLeaks(): boolean {
    const stats = this.getStats();
    const hasLeaks = stats.totalSubscriptions > 100; // Threshold configável
    
    if (hasLeaks) {
      logger.warn('🚨 Possível memory leak detectado:', stats);
    }
    
    return hasLeaks;
  }
}

// ✅ INSTÂNCIA GLOBAL DO EVENT MANAGER
export const eventManager = new EventManager();

// ✅ HOOK PARA USAR EM COMPONENTES REACT
export const useEventManager = () => {
  const subscriptionIds = new Set<string>();
  
  const addEventListener = (
    target: EventTarget,
    eventName: string,
    callback: EventCallback,
    options?: AddEventListenerOptions
  ): string => {
    const id = eventManager.addEventListener(target, eventName, callback, options);
    subscriptionIds.add(id);
    return id;
  };
  
  const removeEventListener = (id: string): boolean => {
    subscriptionIds.delete(id);
    return eventManager.removeEventListener(id);
  };
  
  const cleanup = (): number => {
    let count = 0;
    for (const id of subscriptionIds) {
      if (eventManager.removeEventListener(id)) {
        count++;
      }
    }
    subscriptionIds.clear();
    return count;
  };
  
  return {
    addEventListener,
    removeEventListener,
    cleanup,
    getActiveSubscriptions: () => Array.from(subscriptionIds)
  };
};

// ✅ WRAPPER PARA WINDOW EVENTS (MAIS USADO)
export const windowEventManager = {
  addEventListener: (eventName: string, callback: EventCallback, options?: AddEventListenerOptions) => 
    eventManager.addEventListener(window, eventName, callback, options),
  
  removeEventListener: (id: string) => 
    eventManager.removeEventListener(id),
  
  removeEventListenersByName: (eventName: string) => 
    eventManager.removeEventListenersByName(eventName),
  
  cleanup: () => 
    eventManager.removeAllEventListeners()
};

export default eventManager; 