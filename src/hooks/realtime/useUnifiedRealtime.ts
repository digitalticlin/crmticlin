
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyData } from '../useCompanyData';

interface RealtimeSubscription {
  id: string;
  callback: (payload: any) => void;
  filter?: string;
}

interface UseUnifiedRealtimeProps {
  onLeadInsert?: (payload: any) => void;
  onLeadUpdate?: (payload: any) => void;
  onMessageInsert?: (payload: any) => void;
  onInstanceUpdate?: (payload: any) => void;
  activeInstanceId?: string | null;
}

/**
 * Unified realtime manager to prevent duplicate subscriptions
 * Consolidates all realtime functionality into a single channel per user
 */
export const useUnifiedRealtime = ({
  onLeadInsert,
  onLeadUpdate,
  onMessageInsert,
  onInstanceUpdate,
  activeInstanceId
}: UseUnifiedRealtimeProps) => {
  const { userId } = useCompanyData();
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!userId || !isMountedRef.current) {
      return;
    }

    // Prevent duplicate subscriptions
    if (isSubscribedRef.current && channelRef.current) {
      console.log('[Unified Realtime] Subscription already active, skipping');
      return;
    }

    console.log('[Unified Realtime] 🔄 Setting up unified realtime for user:', userId);

    // Clean up existing channel first
    if (channelRef.current) {
      console.log('[Unified Realtime] 🧹 Removing existing channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    // Create unified channel
    channelRef.current = supabase
      .channel(`unified-realtime-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          if (!isMountedRef.current) return;
          console.log('[Unified Realtime] 📝 New lead:', payload);
          if (onLeadInsert) {
            onLeadInsert(payload);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          if (!isMountedRef.current) return;
          console.log('[Unified Realtime] 📝 Lead updated:', payload);
          if (onLeadUpdate) {
            onLeadUpdate(payload);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: activeInstanceId ? `whatsapp_number_id=eq.${activeInstanceId}` : undefined
        },
        (payload) => {
          if (!isMountedRef.current) return;
          console.log('[Unified Realtime] 💬 New message:', payload);
          if (onMessageInsert) {
            onMessageInsert(payload);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `created_by_user_id=eq.${userId}`
        },
        (payload) => {
          if (!isMountedRef.current) return;
          console.log('[Unified Realtime] 📱 Instance change:', payload);
          if (onInstanceUpdate) {
            onInstanceUpdate(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Unified Realtime] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Unified Realtime] Subscription failed:', status);
          isSubscribedRef.current = false;
        }
      });

    return () => {
      console.log('[Unified Realtime] 🧹 Cleaning up unified subscription');
      isMountedRef.current = false;
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      isSubscribedRef.current = false;
    };
  }, [userId, activeInstanceId, onLeadInsert, onLeadUpdate, onMessageInsert, onInstanceUpdate]);

  return {
    isConnected: isSubscribedRef.current,
    activeChannels: channelRef.current ? 1 : 0
  };
};
