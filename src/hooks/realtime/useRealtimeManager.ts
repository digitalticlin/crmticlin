
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyData } from '../useCompanyData';

interface RealtimeCallback {
  id: string;
  type: 'leadInsert' | 'leadUpdate' | 'messageInsert' | 'instanceUpdate' | 'whatsappInstanceUpdate' | 'notification';
  callback: (payload: any) => void;
  activeInstanceId?: string | null;
  companyId?: string | null;
  leadId?: string | null;
  filters?: {
    [key: string]: any;
  };
}

class RealtimeManager {
  private static instance: RealtimeManager;
  private channel: any = null;
  private callbacks: Map<string, RealtimeCallback> = new Map();
  private isSubscribed = false;
  private userId: string | null = null;
  private companyId: string | null = null;
  private subscriptionPromise: Promise<void> | null = null;
  private retryCount = 0;
  private maxRetries = 3;

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  private constructor() {}

  async initialize(userId: string, companyId?: string | null) {
    if (this.userId === userId && this.companyId === companyId && this.isSubscribed) {
      return;
    }

    if (this.userId !== userId || this.companyId !== companyId) {
      await this.cleanup();
    }

    this.userId = userId;
    this.companyId = companyId;
    
    if (this.subscriptionPromise) {
      await this.subscriptionPromise;
      return;
    }

    this.subscriptionPromise = this.setupChannel();
    await this.subscriptionPromise;
    this.subscriptionPromise = null;
  }

  private async setupChannel(): Promise<void> {
    if (!this.userId || this.channel || this.isSubscribed) {
      return;
    }

    console.log('[Realtime Manager] 🔄 Setting up unified channel for user:', this.userId);

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
          (payload) => this.handleCallback('leadInsert', payload)
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'leads'
          },
          (payload) => this.handleCallback('leadUpdate', payload)
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => this.handleCallback('messageInsert', payload)
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'whatsapp_instances',
            filter: `created_by_user_id=eq.${this.userId}`
          },
          (payload) => this.handleCallback('instanceUpdate', payload)
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'whatsapp_instances'
          },
          (payload) => this.handleCallback('whatsappInstanceUpdate', payload)
        );

      return new Promise((resolve, reject) => {
        if (!this.channel) {
          reject(new Error('Channel not created'));
          return;
        }

        this.channel.subscribe((status: string) => {
          console.log('[Realtime Manager] Subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            this.isSubscribed = true;
            this.retryCount = 0;
            console.log('[Realtime Manager] ✅ Channel subscription completed');
            resolve();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            this.isSubscribed = false;
            console.error('[Realtime Manager] ❌ Subscription failed with status:', status);
            
            if (this.retryCount < this.maxRetries) {
              this.retryCount++;
              console.log(`[Realtime Manager] 🔄 Retrying subscription (${this.retryCount}/${this.maxRetries})`);
              setTimeout(() => {
                this.setupChannel().then(resolve).catch(reject);
              }, 1000 * this.retryCount);
            } else {
              reject(new Error(`Subscription failed after ${this.maxRetries} retries: ${status}`));
            }
          }
        });
      });
    } catch (error) {
      console.error('[Realtime Manager] ❌ Error setting up channel:', error);
      this.isSubscribed = false;
      this.channel = null;
      throw error;
    }
  }

  private handleCallback(type: RealtimeCallback['type'], payload: any) {
    this.callbacks.forEach((callback) => {
      if (callback.type === type) {
        let shouldExecute = true;

        // Aplicar filtros específicos
        if (type === 'messageInsert' && callback.activeInstanceId) {
          const messageData = payload.new;
          if (messageData.whatsapp_number_id !== callback.activeInstanceId) {
            shouldExecute = false;
          }
        }

        if (type === 'whatsappInstanceUpdate' && callback.companyId) {
          const instanceData = payload.new;
          if (instanceData.company_id !== callback.companyId) {
            shouldExecute = false;
          }
        }

        if (callback.leadId && payload.new?.lead_id !== callback.leadId) {
          shouldExecute = false;
        }

        // Aplicar filtros personalizados
        if (callback.filters && shouldExecute) {
          for (const [key, value] of Object.entries(callback.filters)) {
            if (payload.new?.[key] !== value) {
              shouldExecute = false;
              break;
            }
          }
        }

        if (shouldExecute) {
          try {
            callback.callback(payload);
          } catch (error) {
            console.error('[Realtime Manager] ❌ Error in callback:', error);
          }
        }
      }
    });
  }

  registerCallback(
    id: string, 
    type: RealtimeCallback['type'], 
    callback: (payload: any) => void, 
    options?: {
      activeInstanceId?: string | null;
      companyId?: string | null;
      leadId?: string | null;
      filters?: { [key: string]: any };
    }
  ) {
    this.callbacks.set(id, { 
      id, 
      type, 
      callback, 
      activeInstanceId: options?.activeInstanceId,
      companyId: options?.companyId,
      leadId: options?.leadId,
      filters: options?.filters
    });
    console.log(`[Realtime Manager] 📝 Registered callback: ${id} for ${type}`);
  }

  unregisterCallback(id: string) {
    const removed = this.callbacks.delete(id);
    if (removed) {
      console.log(`[Realtime Manager] 🗑️ Unregistered callback: ${id}`);
    }
  }

  async cleanup() {
    if (this.channel) {
      console.log('[Realtime Manager] 🧹 Cleaning up channel');
      try {
        await supabase.removeChannel(this.channel);
      } catch (error) {
        console.error('[Realtime Manager] Error removing channel:', error);
      }
      this.channel = null;
    }
    this.isSubscribed = false;
    this.subscriptionPromise = null;
    this.callbacks.clear();
    this.retryCount = 0;
  }

  getConnectionStatus() {
    return this.isSubscribed;
  }

  getActiveCallbacks() {
    return Array.from(this.callbacks.keys());
  }
}

export const useRealtimeManager = () => {
  const { userId, companyId } = useCompanyData();
  const manager = useRef(RealtimeManager.getInstance());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (userId && isMountedRef.current) {
      manager.current.initialize(userId, companyId).catch((error) => {
        console.error('[Realtime Manager] Initialization failed:', error);
      });
    }

    return () => {
      // Don't cleanup on unmount, let other components continue using it
    };
  }, [userId, companyId]);

  const registerCallback = useCallback((
    id: string, 
    type: RealtimeCallback['type'], 
    callback: (payload: any) => void, 
    options?: {
      activeInstanceId?: string | null;
      companyId?: string | null;
      leadId?: string | null;
      filters?: { [key: string]: any };
    }
  ) => {
    manager.current.registerCallback(id, type, callback, options);
  }, []);

  const unregisterCallback = useCallback((id: string) => {
    manager.current.unregisterCallback(id);
  }, []);

  return {
    registerCallback,
    unregisterCallback,
    isConnected: manager.current.getConnectionStatus(),
    activeCallbacks: manager.current.getActiveCallbacks()
  };
};
