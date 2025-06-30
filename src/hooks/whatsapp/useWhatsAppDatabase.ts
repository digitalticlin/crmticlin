import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WhatsAppInstance {
  id: string;
  instance_name: string;
  connection_status: string;
  phone?: string;
  profile_name?: string;
  qr_code?: string;
  created_at: string;
  updated_at: string;
  vps_instance_id?: string;
  connection_type: string;
  server_url?: string;
  web_status?: string;
  profile_pic_url?: string;
  date_connected?: string;
  date_disconnected?: string;
  company_id?: string;
  created_by_user_id?: string;
}

export const useWhatsAppDatabase = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstances = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .in('connection_status', ['connected', 'ready', 'connecting', 'disconnected'])
        .order('connection_status', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const instancesData = data || [];
      setInstances(instancesData);
      
    } catch (error: any) {
      console.error('[WhatsApp Database] Erro ao carregar instâncias:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveInstance = useMemo(() => {
    return (): WhatsAppInstance | null => {
      const activeInstance = instances.find(i => 
        i.connection_status === 'connected' || 
        i.connection_status === 'ready'
      );
      return activeInstance || null;
    };
  }, [instances]);

  const { connectedInstances, totalInstances, healthScore, isHealthy } = useMemo(() => {
    const connected = instances.filter(i => 
      i.connection_status === 'connected' || i.connection_status === 'ready'
    ).length;
    
    const total = instances.length;
    const score = total === 0 ? 0 : Math.round((connected / total) * 100);
    const healthy = score >= 70;

    return {
      connectedInstances: connected,
      totalInstances: total,
      healthScore: score,
      isHealthy: healthy
    };
  }, [instances]);

  const refetch = () => {
    fetchInstances();
  };

  useEffect(() => {
    fetchInstances();

    const channel = supabase
      .channel('whatsapp-instances-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: 'connection_type=eq.web'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            fetchInstances();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return {
    instances,
    isLoading,
    error,
    getActiveInstance,
    refetch,
    fetchInstances,
    healthScore,
    isHealthy,
    totalInstances,
    connectedInstances
  };
};
