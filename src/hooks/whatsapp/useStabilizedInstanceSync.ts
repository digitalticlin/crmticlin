
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useRealtimeManager } from '../realtime/useRealtimeManager';
import { toast } from 'sonner';

interface StabilizedSyncState {
  instances: any[];
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  syncCount: number;
  orphanCount: number;
  healthScore: number;
}

export const useStabilizedInstanceSync = () => {
  const [state, setState] = useState<StabilizedSyncState>({
    instances: [],
    isLoading: true,
    error: null,
    lastSync: null,
    syncCount: 0,
    orphanCount: 0,
    healthScore: 100
  });

  const { userId } = useCompanyData();
  const { registerCallback, unregisterCallback } = useRealtimeManager();
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const performOptimizedSync = useCallback(async (forceRefresh = false): Promise<any[]> => {
    if (!userId || !isMountedRef.current) {
      return [];
    }

    const now = Date.now();
    const timeSinceLast = now - lastFetchRef.current;
    
    if (!forceRefresh && timeSinceLast < 200) {
      console.log('[Stabilized Sync] ⏸️ Debounce active');
      return state.instances;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      lastFetchRef.current = now;

      console.log('[Stabilized Sync] 🔄 Executing sync for user:', userId);

      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('created_by_user_id', userId)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (!isMountedRef.current) return [];

      if (fetchError) {
        throw fetchError;
      }

      const instances = data || [];
      console.log(`[Stabilized Sync] ✅ ${instances.length} user instances loaded`);
      
      const connectedInstances = instances.filter(i => ['open', 'ready'].includes(i.connection_status));
      const orphanInstances = instances.filter(i => !i.vps_instance_id);
      const healthScore = instances.length > 0 ? Math.round((connectedInstances.length / instances.length) * 100) : 100;

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          instances,
          isLoading: false,
          lastSync: new Date(),
          syncCount: prev.syncCount + 1,
          orphanCount: orphanInstances.length,
          healthScore
        }));

        const readyInstances = instances.filter(i => ['open', 'ready'].includes(i.connection_status));
        if (readyInstances.length > 0) {
          console.log(`[Stabilized Sync] 🎯 ${readyInstances.length} instances READY`);
        }
      }
      
      return instances;
      
    } catch (error: any) {
      if (isMountedRef.current) {
        console.error('[Stabilized Sync] ❌ Sync error:', error);
        setState(prev => ({
          ...prev,
          error: error.message,
          isLoading: false,
          healthScore: Math.max(0, prev.healthScore - 10)
        }));
      }
      return [];
    }
  }, [userId, state.instances]);

  useEffect(() => {
    const handleInstanceUpdate = (payload: any) => {
      console.log('[Stabilized Sync] 📡 Real-time update:', payload.eventType);
      performOptimizedSync(true);
    };

    registerCallback(
      'stabilized-sync-instance-update',
      'instanceUpdate',
      handleInstanceUpdate
    );

    return () => {
      unregisterCallback('stabilized-sync-instance-update');
    };
  }, [performOptimizedSync, registerCallback, unregisterCallback]);

  useEffect(() => {
    if (userId && isMountedRef.current) {
      performOptimizedSync(true);
    }
  }, [userId]);

  const forceOrphanHealing = useCallback(async () => {
    try {
      console.log('[Stabilized Sync] 🔍 Checking global orphans...');
      
      const { data: globalOrphans } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .is('created_by_user_id', null)
        .eq('connection_type', 'web');

      if (globalOrphans && globalOrphans.length > 0) {
        toast.info(`${globalOrphans.length} orphaned instances detected`);
        console.log('[Stabilized Sync] 🏠 Global orphans found:', globalOrphans.map(o => ({
          name: o.instance_name,
          phone: o.phone,
          status: o.connection_status
        })));
      } else {
        toast.success('No orphaned instances found!');
      }
    } catch (error) {
      console.error('[Stabilized Sync] ❌ Error checking orphans:', error);
      toast.error('Error checking orphaned instances');
    }
  }, []);

  return {
    ...state,
    refetch: () => performOptimizedSync(true),
    forceOrphanHealing,
    isHealthy: state.healthScore >= 80
  };
};
