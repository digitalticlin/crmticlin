
/**
 * 🎯 WINDOW EVENT MANAGER - OTIMIZADO FASE 1
 * 
 * Gerenciador centralizado de eventos para evitar memory leaks
 * e melhorar performance de comunicação entre hooks
 */

interface EventSubscription {
  id: string;
  element: EventTarget;
  event: string;
  handler: EventListener;
}

class WindowEventManager {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private counter = 0;

  addEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener
  ): string {
    const id = `event_${++this.counter}`;
    
    element.addEventListener(event, handler);
    
    this.subscriptions.set(id, {
      id,
      element,
      event,
      handler
    });
    
    console.log(`[EventManager] ✅ Adicionado listener: ${event} (ID: ${id})`);
    return id;
  }

  removeEventListener(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      subscription.element.removeEventListener(subscription.event, subscription.handler);
      this.subscriptions.delete(id);
      console.log(`[EventManager] 🗑️ Removido listener: ${subscription.event} (ID: ${id})`);
    }
  }

  removeAllListeners(): void {
    this.subscriptions.forEach(subscription => {
      subscription.element.removeEventListener(subscription.event, subscription.handler);
    });
    this.subscriptions.clear();
    console.log(`[EventManager] 🧹 Todos os listeners removidos`);
  }

  getActiveSubscriptions(): number {
    return this.subscriptions.size;
  }
}

export const windowEventManager = new WindowEventManager();
