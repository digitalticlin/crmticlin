
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WhatsAppWebInstance } from './useWhatsAppWebInstances';

export const useInstancesData = () => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  const mapDatabaseToInstance = (dbInstance: any): WhatsAppWebInstance => {
    return {
      id: dbInstance.id,
      instance_name: dbInstance.instance_name,
      phone: dbInstance.phone || '',
      connection_status: dbInstance.connection_status || 'disconnected',
      web_status: dbInstance.web_status || '',
      qr_code: dbInstance.qr_code,
      date_connected: dbInstance.date_connected,
      date_disconnected: dbInstance.date_disconnected,
      vps_instance_id: dbInstance.vps_instance_id,
      server_url: dbInstance.server_url,
      updated_at: dbInstance.updated_at,
      profile_name: dbInstance.profile_name,
      profile_pic_url: dbInstance.profile_pic_url
    };
  };

  const fetchInstances = useCallback(async () => {
    if (!user?.id) {
      console.log('[useInstancesData] Usuário não autenticado, pulando fetch');
      setInstances([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[useInstancesData] 🔄 CORREÇÃO: Buscando instâncias para usuário:', user.id);

      // CORREÇÃO: Buscar TODAS as instâncias do usuário, incluindo as com erro
      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('created_by_user_id', user.id)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const mappedInstances = (data || []).map(mapDatabaseToInstance);
      
      console.log(`[useInstancesData] ✅ CORREÇÃO: ${mappedInstances.length} instâncias carregadas (incluindo com erro)`);
      console.log('[useInstancesData] Instâncias:', mappedInstances.map(i => ({
        id: i.id.substring(0, 8),
        name: i.instance_name,
        status: i.connection_status,
        web_status: i.web_status
      })));

      setInstances(mappedInstances);
      
    } catch (error: any) {
      console.error('[useInstancesData] ❌ Erro ao buscar instâncias:', error);
      setError(error.message);
      setInstances([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const refetch = useCallback(() => {
    console.log('[useInstancesData] 🔄 Refetch solicitado');
    fetchInstances();
  }, [fetchInstances]);

  // Initial fetch
  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  // Real-time subscription para atualizações
  useEffect(() => {
    if (!user?.id) return;

    console.log('[useInstancesData] 📡 Configurando real-time subscription');

    const channel = supabase
      .channel(`instances-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `created_by_user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[useInstancesData] 📡 Real-time update:', payload.eventType);
          
          // CORREÇÃO: Verificação mais robusta do payload
          if (payload.new && typeof payload.new === 'object' && 'instance_name' in payload.new) {
            console.log('[useInstancesData] 📡 Instância atualizada:', payload.new.instance_name);
          }
          
          // Re-fetch dados quando houver mudanças
          fetchInstances();
        }
      )
      .subscribe();

    return () => {
      console.log('[useInstancesData] 🧹 Cleanup real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchInstances]);

  return {
    instances,
    isLoading,
    error,
    fetchInstances,
    refetch
  };
};
