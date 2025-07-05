
import { useEffect, useCallback, useRef } from 'react';
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
  
  // Configurações otimizadas para melhor responsividade
  private readonly DEBOUNCE_TIME = 300; // Otimizado para 300ms
  private readonly MIN_UPDATE_INTERVAL = 1000; // Otimizado para 1s
  private readonly MAX_CALLBACKS_PER_EVENT = 5; // Aumentado para 5

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  constructor() {
    this.isInitialized = true;
    console.log('[Realtime Manager] 🏗️ Instância criada');
  }

  setUserId(userId: string | null) {
    if (this.userId !== userId) {
      console.log('[Realtime Manager] 👤 Alterando usuário:', userId);
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
      console.log('[Realtime Manager] 🚀 Configurando canal para:', this.userId);
      
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
        );

      const { error } = await this.channel.subscribe();
      
      if (error) {
        console.error('[Realtime Manager] ❌ Erro na subscrição:', error);
      } else {
        this.isSubscribed = true;
        console.log('[Realtime Manager] ✅ Canal ativo');
      }
    } catch (error) {
      console.error('[Realtime Manager] ❌ Erro na configuração:', error);
    }
  }

  // Handler ULTRA otimizado com controle rigoroso
  private handleCallbackWithFilter(eventType: string, payload: any) {
    if (!this.isInitialized) return;
    
    const now = Date.now();
    const lastUpdate = this.lastUpdateTimes.get(eventType) || 0;
    
    // Throttling MUITO rigoroso
    if (now - lastUpdate < this.MIN_UPDATE_INTERVAL) {
      console.log(`[Realtime Manager] ⏸️ Throttled ${eventType} - muito rápido`);
      return;
    }

    const callbacks = this.callbacks.get(eventType);
    if (!callbacks || callbacks.size === 0) {
      return;
    }

    // Controle rigoroso de callbacks
    if (callbacks.size > this.MAX_CALLBACKS_PER_EVENT) {
      console.warn(`[Realtime Manager] ⚠️ Muitos callbacks para ${eventType}:`, callbacks.size);
      return;
    }

    const debounceKey = `${eventType}-${payload.new?.id || 'unknown'}`;
    
    // Limpar timer anterior
    if (this.debounceTimers.has(debounceKey)) {
      clearTimeout(this.debounceTimers.get(debounceKey)!);
    }

    // Debounce rigoroso
    const timer = setTimeout(() => {
      console.log(`[Realtime Manager] 🔄 Executando callbacks para ${eventType}`);
      
      callbacks.forEach((callbackData, id) => {
        const shouldTrigger = this.shouldTriggerCallback(callbackData, payload);
        
        if (shouldTrigger) {
          try {
            callbackData.callback(payload);
          } catch (error) {
            console.error(`[Realtime Manager] ❌ Erro no callback ${id}:`, error);
          }
        }
      });
      
      this.debounceTimers.delete(debounceKey);
      this.lastUpdateTimes.set(eventType, now);
    }, this.DEBOUNCE_TIME);

    this.debounceTimers.set(debounceKey, timer);
  }

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
      console.warn('[Realtime Manager] ⚠️ Tentando registrar callback antes da inicialização');
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
    
    const eventCallbacks = this.callbacks.get(eventType)!;
    
    // Prevenir registros duplicados
    if (eventCallbacks.has(id)) {
      console.log(`[Realtime Manager] 🔄 Substituindo callback ${id}`);
      eventCallbacks.delete(id);
    }
    
    eventCallbacks.set(id, callbackData);
    console.log(`[Realtime Manager] ✅ Callback registrado: ${id} para ${eventType}`);
  }

  unregisterCallback(id: string) {
    if (!this.isInitialized) return;
    
    let found = false;
    this.callbacks.forEach((callbackMap, eventType) => {
      if (callbackMap.has(id)) {
        callbackMap.delete(id);
        found = true;
        console.log(`[Realtime Manager] 🗑️ Callback removido: ${id} de ${eventType}`);
      }
    });
    
    if (!found) {
      console.log(`[Realtime Manager] ⚠️ Callback não encontrado: ${id}`);
    }
  }

  cleanup() {
    console.log('[Realtime Manager] 🧹 Limpeza iniciada');
    
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
    
    console.log('[Realtime Manager] ✅ Limpeza concluída');
  }

  // Método para debug
  getStats() {
    const totalCallbacks = Array.from(this.callbacks.values())
      .reduce((sum, map) => sum + map.size, 0);
      
    return {
      isSubscribed: this.isSubscribed,
      totalCallbacks,
      activeTimers: this.debounceTimers.size,
      eventTypes: Array.from(this.callbacks.keys())
    };
  }
}

export const useRealtimeManager = () => {
  const { user } = useAuth();
  const realtimeManager = RealtimeManager.getInstance();
  const userIdRef = useRef(user?.id);

  // Configurar userId apenas quando necessário
  useEffect(() => {
    if (userIdRef.current !== user?.id) {
      userIdRef.current = user?.id;
      realtimeManager.setUserId(user?.id || null);
    }
  }, [user?.id, realtimeManager]);

  // Funções estáveis
  const registerCallback = useCallback((id: string, eventType: string, callback: (payload: any) => void, filter?: any) => {
    realtimeManager.registerCallback(id, eventType, callback, filter);
  }, [realtimeManager]);

  const unregisterCallback = useCallback((id: string) => {
    realtimeManager.unregisterCallback(id);
  }, [realtimeManager]);

  // Debug stats
  const getStats = useCallback(() => {
    return realtimeManager.getStats();
  }, [realtimeManager]);

  return {
    registerCallback,
    unregisterCallback,
    getStats,
    isConnected: !!user?.id
  };
};
