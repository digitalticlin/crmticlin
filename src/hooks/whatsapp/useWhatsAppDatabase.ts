
import { useState, useEffect } from 'react';
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
}

export const useWhatsAppDatabase = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar instâncias do banco
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

  // Obter instância ativa
  const getActiveInstance = (): WhatsAppInstance | null => {
    const activeInstance = instances.find(i => 
      i.connection_status === 'connected' || 
      i.connection_status === 'ready'
    );
    return activeInstance || null;
  };

  // Recarregar instâncias
  const refetch = () => {
    fetchInstances();
  };

  // Configurar subscription em tempo real
  useEffect(() => {
    fetchInstances();

    const channel = supabase
      .channel('whatsapp-instances-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: 'connection_type=eq.web'
        },
        (payload) => {
          console.log('[useWhatsAppDatabase] Atualização em tempo real:', payload);
          fetchInstances(); // Recarregar quando houver mudanças
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    instances,
    isLoading,
    error,
    getActiveInstance,
    refetch,
    fetchInstances
  };
};
