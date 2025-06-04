
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppWebInstance } from './useWhatsAppWebInstances';

// Database-only hook - NO VPS requests, only Supabase queries
export const useWhatsAppDatabase = (companyId: string | null, companyLoading: boolean) => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);

  // Fetch instances from database only
  const fetchInstancesFromDB = async () => {
    if (!companyId || companyLoading || !isMountedRef.current) {
      return;
    }

    try {
      console.log('[useWhatsAppDatabase] Fetching instances from database only...');
      setLoading(true);
      setError(null);

      const { data: instancesData, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (isMountedRef.current) {
        const mappedInstances: WhatsAppWebInstance[] = (instancesData || []).map(instance => ({
          id: instance.id,
          instance_name: instance.instance_name || '',
          connection_type: instance.connection_type || 'web',
          server_url: instance.server_url || '',
          vps_instance_id: instance.vps_instance_id || '',
          web_status: instance.web_status || '',
          connection_status: instance.connection_status || 'disconnected',
          qr_code: instance.qr_code,
          phone: instance.phone || '',
          profile_name: instance.profile_name,
          company_id: instance.company_id
        }));

        console.log('[useWhatsAppDatabase] Instances loaded from DB:', mappedInstances.length);
        setInstances(mappedInstances);
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        console.error('[useWhatsAppDatabase] Error fetching instances:', error);
        setError(error.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Get active instance (connected)
  const getActiveInstance = () => {
    return instances.find(instance => 
      instance.connection_type === 'web' && 
      instance.connection_status === 'connected'
    ) || null;
  };

  // Initial load
  useEffect(() => {
    if (companyId && !companyLoading) {
      fetchInstancesFromDB();
    }
  }, [companyId, companyLoading]);

  // Realtime subscription for whatsapp_instances table
  useEffect(() => {
    if (!companyId) return;

    console.log('[useWhatsAppDatabase] Setting up realtime subscription for instances...');

    const channel = supabase
      .channel(`whatsapp-instances-db-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          console.log('[useWhatsAppDatabase] Realtime update:', payload.eventType);
          if (isMountedRef.current) {
            fetchInstancesFromDB();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[useWhatsAppDatabase] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    instances,
    loading,
    error,
    refetch: fetchInstancesFromDB,
    getActiveInstance
  };
};
