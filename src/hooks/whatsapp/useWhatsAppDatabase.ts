
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeManager } from '../realtime/useRealtimeManager';

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
  const { registerCallback, unregisterCallback } = useRealtimeManager();

  const fetchInstances = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const instancesData = data || [];
      setInstances(instancesData);
      
      console.log('[useWhatsAppDatabase] Instâncias carregadas:', instancesData.length);
      
    } catch (error: any) {
      console.error('[useWhatsAppDatabase] Erro ao buscar instâncias:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveInstance = (): WhatsAppInstance | null => {
    const activeInstance = instances.find(i => 
      i.connection_status === 'connected' || 
      i.connection_status === 'ready'
    );
    return activeInstance || null;
  };

  const connectedInstances = instances.filter(i => 
    i.connection_status === 'connected' || i.connection_status === 'ready'
  ).length;

  const totalInstances = instances.length;
  const healthScore = totalInstances === 0 ? 0 : Math.round((connectedInstances / totalInstances) * 100);
  const isHealthy = healthScore >= 70;

  const refetch = () => {
    fetchInstances();
  };

  useEffect(() => {
    fetchInstances();

    const handleInstanceUpdate = (payload: any) => {
      console.log('[useWhatsAppDatabase] Atualização em tempo real:', payload);
      fetchInstances();
    };

    registerCallback(
      'whatsapp-database-realtime',
      'whatsappInstanceUpdate',
      handleInstanceUpdate,
      {
        filters: { connection_type: 'web' }
      }
    );

    return () => {
      unregisterCallback('whatsapp-database-realtime');
    };
  }, [registerCallback, unregisterCallback]);

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
