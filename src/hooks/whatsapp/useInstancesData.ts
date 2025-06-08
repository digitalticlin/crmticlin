
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StatusSyncService } from '@/services/whatsapp/statusSyncService';
import { WhatsAppWebInstance } from './useWhatsAppWebInstances';

export const useInstancesData = () => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstances = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[Instances Data] 📊 Buscando instâncias...');
      
      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      console.log(`[Instances Data] ✅ ${data?.length || 0} instâncias encontradas`);
      
      // CORREÇÃO: Sincronizar status após buscar dados
      if (data && data.length > 0) {
        console.log('[Instances Data] 🔄 Iniciando sincronização de status...');
        
        // Sincronizar status de todas as instâncias em paralelo
        const syncPromises = data.map(async (instance) => {
          if (instance.vps_instance_id) {
            try {
              await StatusSyncService.syncInstanceStatus(instance.id);
            } catch (err) {
              console.warn(`[Instances Data] ⚠️ Erro ao sincronizar ${instance.instance_name}:`, err);
            }
          }
        });
        
        await Promise.allSettled(syncPromises);
        
        // Buscar dados atualizados após sincronização
        const { data: updatedData, error: refetchError } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('connection_type', 'web')
          .order('created_at', { ascending: false });

        if (!refetchError && updatedData) {
          console.log('[Instances Data] ✅ Dados sincronizados e atualizados');
          setInstances(updatedData);
        } else {
          setInstances(data);
        }
      } else {
        setInstances(data || []);
      }

    } catch (err: any) {
      console.error('[Instances Data] ❌ Erro ao buscar instâncias:', err);
      setError(err.message);
      setInstances([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchInstances();
  }, [fetchInstances]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  return {
    instances,
    isLoading,
    error,
    fetchInstances,
    refetch
  };
};
