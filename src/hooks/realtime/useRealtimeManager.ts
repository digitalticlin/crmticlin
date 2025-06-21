
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyData } from '../useCompanyData';

interface RealtimeCallback {
  id: string;
  type: 'leadInsert' | 'leadUpdate' | 'messageInsert' | 'instanceUpdate';
  callback: (payload: any) => void;
  activeInstanceId?: string | null;
}

class RealtimeManager {
  private static instance: RealtimeManager;
  private channel: any = null;
  private callbacks: Map<string, RealtimeCallback> = new Map();
  private isSubscribed = false;
  private userId: string | null = null;
  private subscriptionPromise: Promise<void> | null = null;

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  private constructor() {}

  async initialize(userId: string) {
    if (this.userId === userId && this.isSubscribed) {
      return; // Already initialized for this user
    }

    if (this.userId !== userId) {
      await this.cleanup();
    }

    this.userId = userId;
    
    // If already subscribing, wait for it to complete
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
        );

      // Subscribe and wait for completion
      return new Promise((resolve, reject) => {
        if (!this.channel) {
          reject(new Error('Channel not created'));
          return;
        }

        this.channel.subscribe((status: string) => {
          console.log('[Realtime Manager] Subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            this.isSubscribed = true;
            console.log('[Realtime Manager] ✅ Channel subscription completed');
            resolve();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            this.isSubscribed = false;
            console.error('[Realtime Manager] ❌ Subscription failed with status:', status);
            reject(new Error(`Subscription failed: ${status}`));
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
        // For message inserts, check if we need to filter by instance
        if (type === 'messageInsert' && callback.activeInstanceId) {
          const messageData = payload.new;
          if (messageData.whatsapp_number_id !== callback.activeInstanceId) {
            return; // Skip this callback
          }
        }
        callback.callback(payload);
      }
    });
  }

  registerCallback(id: string, type: RealtimeCallback['type'], callback: (payload: any) => void, activeInstanceId?: string | null) {
    this.callbacks.set(id, { id, type, callback, activeInstanceId });
  }

  unregisterCallback(id: string) {
    this.callbacks.delete(id);
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
  }

  getConnectionStatus() {
    return this.isSubscribed;
  }
}

export const useRealtimeManager = () => {
  const { userId } = useCompanyData();
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
      manager.current.initialize(userId).catch((error) => {
        console.error('[Realtime Manager] Initialization failed:', error);
      });
    }

    return () => {
      // Don't cleanup on unmount, let other components continue using it
    };
  }, [userId]);

  const registerCallback = useCallback((id: string, type: RealtimeCallback['type'], callback: (payload: any) => void, activeInstanceId?: string | null) => {
    manager.current.registerCallback(id, type, callback, activeInstanceId);
  }, []);

  const unregisterCallback = useCallback((id: string) => {
    manager.current.unregisterCallback(id);
  }, []);

  return {
    registerCallback,
    unregisterCallback,
    isConnected: manager.current.getConnectionStatus()
  };
};
