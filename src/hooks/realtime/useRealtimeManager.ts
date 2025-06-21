
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

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  private constructor() {}

  initialize(userId: string) {
    if (this.userId === userId && this.isSubscribed) {
      return; // Already initialized for this user
    }

    this.cleanup();
    this.userId = userId;
    this.setupChannel();
  }

  private setupChannel() {
    if (!this.userId || this.channel) return;

    console.log('[Realtime Manager] 🔄 Setting up unified channel for user:', this.userId);

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
      .subscribe((status: string) => {
        console.log('[Realtime Manager] Subscription status:', status);
        this.isSubscribed = status === 'SUBSCRIBED';
      });
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

  cleanup() {
    if (this.channel) {
      console.log('[Realtime Manager] 🧹 Cleaning up channel');
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.isSubscribed = false;
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
      manager.current.initialize(userId);
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
