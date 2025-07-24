/**
 * ✅ SISTEMA DE POOL DE CONEXÕES REALTIME
 * Consolida múltiplas subscriptions para melhorar performance
 */

import { supabase } from '@/integrations/supabase/client';
import { realtimeLogger } from './logger';

type EventHandler = (payload: any) => void;
type SubscriptionFilter = {
  event: string;
  schema: string;
  table: string;
  filter?: string;
};

interface PooledSubscription {
  id: string;
  filter: SubscriptionFilter;
  handlers: Map<string, EventHandler>;
  channel: any;
  isActive: boolean;
}

class RealtimeConnectionPool {
  private pools: Map<string, PooledSubscription> = new Map();
  private handlerCounter = 0;

  // ✅ GERAR CHAVE ÚNICA PARA SUBSCRIPTION
  private generatePoolKey(filter: SubscriptionFilter): string {
    return `${filter.table}_${filter.event}_${filter.filter || 'all'}`;
  }

  // ✅ GERAR ID ÚNICO PARA HANDLER
  private generateHandlerId(): string {
    return `handler_${++this.handlerCounter}_${Date.now()}`;
  }

  // ✅ ADICIONAR HANDLER A POOL EXISTENTE OU CRIAR NOVA
  subscribe(filter: SubscriptionFilter, handler: EventHandler): string {
    const poolKey = this.generatePoolKey(filter);
    const handlerId = this.generateHandlerId();
    
    let pool = this.pools.get(poolKey);
    
    if (!pool) {
      // Criar nova pool se não existir
      pool = this.createNewPool(poolKey, filter);
      this.pools.set(poolKey, pool);
    }
    
    // Adicionar handler à pool
    pool.handlers.set(handlerId, handler);
    
    realtimeLogger.log(`Handler adicionado à pool ${poolKey}: ${handlerId}`);
    realtimeLogger.log(`Pool stats: ${pool.handlers.size} handlers ativos`);
    
    return handlerId;
  }

  // ✅ CRIAR NOVA POOL DE CONEXÃO
  private createNewPool(poolKey: string, filter: SubscriptionFilter): PooledSubscription {
    const channelId = `pool_${poolKey}_${Date.now()}`;
    
    realtimeLogger.log(`Criando nova pool: ${poolKey}`);
    
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: filter.event as any,
        schema: filter.schema,
        table: filter.table,
        ...(filter.filter && { filter: filter.filter })
      }, (payload) => {
        this.distributeEvent(poolKey, payload);
      })
      .subscribe((status) => {
        const pool = this.pools.get(poolKey);
        if (pool) {
          pool.isActive = status === 'SUBSCRIBED';
          realtimeLogger.log(`Pool ${poolKey} status: ${status}`);
        }
      });

    return {
      id: channelId,
      filter,
      handlers: new Map(),
      channel,
      isActive: false
    };
  }

  // ✅ DISTRIBUIR EVENTO PARA TODOS OS HANDLERS DA POOL
  private distributeEvent(poolKey: string, payload: any) {
    const pool = this.pools.get(poolKey);
    if (!pool) return;

    realtimeLogger.debug(`Distribuindo evento para ${pool.handlers.size} handlers na pool ${poolKey}`);
    
    for (const [handlerId, handler] of pool.handlers.entries()) {
      try {
        handler(payload);
      } catch (error) {
        realtimeLogger.error(`Erro no handler ${handlerId}:`, error);
        // Não remover handler automaticamente em caso de erro
      }
    }
  }

  // ✅ REMOVER HANDLER ESPECÍFICO
  unsubscribe(handlerId: string): boolean {
    for (const [poolKey, pool] of this.pools.entries()) {
      if (pool.handlers.has(handlerId)) {
        pool.handlers.delete(handlerId);
        realtimeLogger.log(`Handler removido: ${handlerId} da pool ${poolKey}`);
        
        // Se não há mais handlers, remover a pool
        if (pool.handlers.size === 0) {
          this.removePool(poolKey);
        }
        
        return true;
      }
    }
    
    realtimeLogger.warn(`Handler não encontrado: ${handlerId}`);
    return false;
  }

  // ✅ REMOVER POOL COMPLETA
  private removePool(poolKey: string) {
    const pool = this.pools.get(poolKey);
    if (!pool) return;

    realtimeLogger.log(`Removendo pool: ${poolKey}`);
    
    try {
      supabase.removeChannel(pool.channel);
    } catch (error) {
      realtimeLogger.error(`Erro ao remover canal da pool ${poolKey}:`, error);
    }
    
    this.pools.delete(poolKey);
  }

  // ✅ CLEANUP GERAL
  cleanup(): number {
    const poolCount = this.pools.size;
    
    for (const [poolKey, pool] of this.pools.entries()) {
      try {
        supabase.removeChannel(pool.channel);
      } catch (error) {
        realtimeLogger.error(`Erro no cleanup da pool ${poolKey}:`, error);
      }
    }
    
    this.pools.clear();
    this.handlerCounter = 0;
    
    realtimeLogger.log(`Cleanup completo: ${poolCount} pools removidas`);
    return poolCount;
  }

  // ✅ ESTATÍSTICAS PARA MONITORAMENTO
  getStats() {
    const stats = {
      totalPools: this.pools.size,
      totalHandlers: 0,
      activePools: 0,
      poolDetails: [] as any[]
    };

    for (const [poolKey, pool] of this.pools.entries()) {
      stats.totalHandlers += pool.handlers.size;
      if (pool.isActive) stats.activePools++;
      
      stats.poolDetails.push({
        key: poolKey,
        handlersCount: pool.handlers.size,
        isActive: pool.isActive,
        filter: pool.filter
      });
    }

    return stats;
  }

  // ✅ VERIFICAR SAÚDE DAS CONEXÕES
  healthCheck(): boolean {
    const stats = this.getStats();
    const hasUnhealthyPools = stats.poolDetails.some(pool => 
      pool.handlersCount > 0 && !pool.isActive
    );

    if (hasUnhealthyPools) {
      realtimeLogger.warn('Pools não saudáveis detectadas:', stats);
    }

    return !hasUnhealthyPools;
  }
}

// ✅ INSTÂNCIA GLOBAL DO POOL
export const realtimePool = new RealtimeConnectionPool();

// ✅ HELPER FUNCTIONS PARA USO MAIS FÁCIL
export const subscribeToLeads = (instanceId: string, handler: EventHandler) => {
  return realtimePool.subscribe({
    event: '*',
    schema: 'public',
    table: 'leads',
    filter: `whatsapp_number_id=eq.${instanceId}`
  }, handler);
};

export const subscribeToMessages = (leadId: string, instanceId: string, handler: EventHandler) => {
  return realtimePool.subscribe({
    event: '*',
    schema: 'public',
    table: 'messages',
    filter: `lead_id=eq.${leadId} AND whatsapp_number_id=eq.${instanceId}`
  }, handler);
};

export const subscribeToTags = (userId: string, handler: EventHandler) => {
  return realtimePool.subscribe({
    event: '*',
    schema: 'public',
    table: 'tags',
    filter: `created_by_user_id=eq.${userId}`
  }, handler);
};

// ✅ CLEANUP AUTOMÁTICO AO FECHAR PÁGINA
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimePool.cleanup();
  });
}

export default realtimePool; 