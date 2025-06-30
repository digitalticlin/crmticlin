import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RealtimeCallback {
  id: string;
  callback: (payload: any) => void;
  filter?: {
    leadId?: string;
    activeInstanceId?: string;
  };
}

class RealtimeManager {
  private static instance: RealtimeManager;
  private userId: string | null = null;
  private channel: any = null;
  private isSubscribed = false;
  private callbacks: Map<string, Map<string, RealtimeCallback>> = new Map();
  private lastUpdateTimes: Map<string, number> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;
  
  // Configurações otimizadas
  private readonly DEBOUNCE_TIME = 300;
  private readonly MIN_UPDATE_INTERVAL = 1000; // Aumentado para 1s
  private readonly MAX_CALLBACKS_PER_EVENT = 5; // Limitar callbacks

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  constructor() {
    this.isInitialized = true;
  }

  setUserId(userId: string | null) {
    if (this.userId !== userId) {
      this.cleanup();
      this.userId = userId;
      if (userId) {
        this.setupChannel();
      }
    }
  }

  private async setupChannel(): Promise<void> {
    if (!this.userId || this.channel || this.isSubscribed) {
      return;
    }

    try {
      this.channel = supabase
        .channel(`unified-realtime-${this.userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'leads'
          },
          (payload) => this.handleCallbackWithFilter('leadInsert', payload)
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'leads'
          },
          (payload) => this.handleCallbackWithFilter('leadUpdate', payload)
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => this.handleCallbackWithFilter('messageInsert', payload)
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'whatsapp_instances',
            filter: `created_by_user_id=eq.${this.userId}`
          },
          (payload) => this.handleCallbackWithFilter('instanceUpdate', payload)
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'whatsapp_instances'
          },
          (payload) => this.handleCallbackWithFilter('whatsappInstanceUpdate', payload)
        );

      const { error } = await this.channel.subscribe();
      
      if (error) {
        console.error('[Realtime] ❌ Subscription error:', error);
      } else {
            this.isSubscribed = true;
      }
    } catch (error) {
      console.error('[Realtime] ❌ Setup error:', error);
    }
  }

  // Callback handler otimizado com controle rigoroso de frequência
  private handleCallbackWithFilter(eventType: string, payload: any) {
    if (!this.isInitialized) return;
    
    const now = Date.now();
    const lastUpdate = this.lastUpdateTimes.get(eventType) || 0;
    
    // Throttling rigoroso
    if (now - lastUpdate < this.MIN_UPDATE_INTERVAL) {
      return;
    }

    const callbacks = this.callbacks.get(eventType);
    if (!callbacks || callbacks.size === 0) {
      return;
    }

    // Limitar número de callbacks para evitar spam
    if (callbacks.size > this.MAX_CALLBACKS_PER_EVENT) {
      console.warn(`[Realtime] ⚠️ Too many callbacks for ${eventType}:`, callbacks.size);
      return;
    }

    // Debouncing avançado por evento
    const debounceKey = `${eventType}-${payload.new?.id || 'unknown'}`;
    
    if (this.debounceTimers.has(debounceKey)) {
      clearTimeout(this.debounceTimers.get(debounceKey)!);
    }

    const timer = setTimeout(() => {
      callbacks.forEach((callbackData, id) => {
        const shouldTrigger = this.shouldTriggerCallback(callbackData, payload);
        
        if (shouldTrigger) {
          try {
            callbackData.callback(payload);
          } catch (error) {
            console.error(`[Realtime] ❌ Callback error ${id}:`, error);
          }
        }
      });
      
      this.debounceTimers.delete(debounceKey);
    }, this.DEBOUNCE_TIME);

    this.debounceTimers.set(debounceKey, timer);
    this.lastUpdateTimes.set(eventType, now);
  }

  // Filtros otimizados
  private shouldTriggerCallback(callbackData: RealtimeCallback, payload: any): boolean {
    const { filter } = callbackData;
    
    if (!filter) return true;
    
    if (filter.leadId && payload.new?.lead_id) {
      return payload.new.lead_id === filter.leadId;
    }
    
    if (filter.activeInstanceId && payload.new?.whatsapp_number_id) {
      return payload.new.whatsapp_number_id === filter.activeInstanceId;
    }
    
    return true;
  }

  registerCallback(id: string, eventType: string, callback: (payload: any) => void, filter?: any) {
    if (!this.isInitialized) {
      console.warn('[Realtime] ⚠️ Tentando registrar callback antes da inicialização');
      return;
    }

    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, new Map());
    }

    const callbackData: RealtimeCallback = {
      id,
      callback, 
      filter
    };
    
    // Prevenir registros duplicados
    const eventCallbacks = this.callbacks.get(eventType)!;
    if (eventCallbacks.has(id)) {
      eventCallbacks.delete(id); // Remove primeiro se já existe
    }
    
    eventCallbacks.set(id, callbackData);
  }

  unregisterCallback(id: string) {
    if (!this.isInitialized) return;
    
    this.callbacks.forEach((callbackMap) => {
      if (callbackMap.has(id)) {
        callbackMap.delete(id);
      }
    });
  }

  cleanup() {
    // Limpar todos os timers
    this.debounceTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.debounceTimers.clear();
    
    // Limpar callbacks
    this.callbacks.clear();
    
    // Unsubscribe do canal
    if (this.channel && this.isSubscribed) {
      this.channel.unsubscribe();
    }
    
    this.channel = null;
    this.isSubscribed = false;
    this.lastUpdateTimes.clear();
  }

  destroy() {
    this.cleanup();
    this.isInitialized = false;
    RealtimeManager.instance = null as any;
  }
}

export const useRealtimeManager = () => {
  const { user } = useAuth();
  const realtimeManager = RealtimeManager.getInstance();

  // Configurar userId automaticamente
  useEffect(() => {
    if (user?.id && realtimeManager) {
      realtimeManager.setUserId(user.id);
    }
  }, [user?.id, realtimeManager]);

  // Funções de interface compatíveis com verificação de segurança
  const registerCallback = useCallback((id: string, eventType: string, callback: (payload: any) => void, filter?: any) => {
    if (realtimeManager && realtimeManager.registerCallback) {
      realtimeManager.registerCallback(id, eventType, callback, filter);
    }
  }, [realtimeManager]);

  const unregisterCallback = useCallback((id: string) => {
    if (realtimeManager && realtimeManager.unregisterCallback) {
      realtimeManager.unregisterCallback(id);
    }
  }, [realtimeManager]);

  useEffect(() => {
    return () => {
      // Cleanup ao desmontar o último componente
      if (realtimeManager && realtimeManager['callbacks']) {
        const hasActiveCallbacks = Array.from(realtimeManager['callbacks'].values())
          .some(map => map.size > 0);
          
        if (!hasActiveCallbacks) {
          realtimeManager.cleanup();
        }
      }
    };
  }, [realtimeManager]);

  return {
    registerCallback,
    unregisterCallback,
    isConnected: !!user?.id,
    // Expor instância para hooks otimizados
    instance: realtimeManager
  };
};
