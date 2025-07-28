
/**
 * 🚀 EVENT MANAGER PARA COMUNICAÇÃO GLOBAL OTIMIZADA - FASE 1
 * 
 * Centralizador de eventos para evitar memory leaks e duplicação
 */

interface EventCallback {
  (data: any): void;
}

interface EventSubscription {
  id: string;
  callback: EventCallback;
  cleanup?: () => void;
}

class WindowEventManager {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private subscriptionIdCounter = 0;

  addEventListener(eventType: string, callback: EventCallback, options?: { once?: boolean }): string {
    const subscriptionId = `${eventType}_${++this.subscriptionIdCounter}`;
    
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    const subscription: EventSubscription = {
      id: subscriptionId,
      callback: options?.once ? (data) => {
        callback(data);
        this.removeEventListener(subscriptionId);
      } : callback
    };

    this.subscriptions.get(eventType)!.push(subscription);
    
    console.log(`[EventManager] ✅ Listener adicionado: ${eventType} (${subscriptionId})`);
    return subscriptionId;
  }

  removeEventListener(subscriptionId: string): void {
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        const subscription = subscriptions[index];
        if (subscription.cleanup) {
          subscription.cleanup();
        }
        subscriptions.splice(index, 1);
        
        if (subscriptions.length === 0) {
          this.subscriptions.delete(eventType);
        }
        
        console.log(`[EventManager] 🧹 Listener removido: ${eventType} (${subscriptionId})`);
        return;
      }
    }
  }

  dispatchEvent(eventType: string, data: any): void {
    const subscriptions = this.subscriptions.get(eventType);
    if (!subscriptions || subscriptions.length === 0) {
      console.log(`[EventManager] ⚠️ Nenhum listener para: ${eventType}`);
      return;
    }

    console.log(`[EventManager] 📡 Dispatching: ${eventType} para ${subscriptions.length} listeners`);
    
    subscriptions.forEach(subscription => {
      try {
        subscription.callback(data);
      } catch (error) {
        console.error(`[EventManager] ❌ Erro no listener ${subscription.id}:`, error);
      }
    });
  }

  // Método para debug
  getActiveSubscriptions(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      result[eventType] = subscriptions.length;
    }
    return result;
  }

  // Cleanup completo
  cleanup(): void {
    console.log(`[EventManager] 🧹 Cleanup completo de ${this.subscriptions.size} tipos de eventos`);
    this.subscriptions.clear();
  }
}

export const windowEventManager = new WindowEventManager();
