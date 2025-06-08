
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppWebInstance } from './useWhatsAppWebInstances';

export const useInstancesData = () => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstances = useCallback(async () => {
    try {
      console.log('[Instances Data] 📊 Buscando instâncias v2.0...');
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[Instances Data] ❌ Erro ao buscar:', fetchError);
        setError(fetchError.message);
        return;
      }

      console.log('[Instances Data] ✅ Instâncias carregadas v2.0:', data?.length || 0);
      setInstances(data || []);

    } catch (error: any) {
      console.error('[Instances Data] ❌ Erro inesperado v2.0:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch inicial
  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  // ETAPA 3: Realtime para QR Codes automáticos
  useEffect(() => {
    console.log('[Instances Data] 🔄 Configurando realtime v2.0...');
    
    const channel = supabase
      .channel('whatsapp_instances_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances'
        },
        (payload) => {
          console.log('[Instances Data] 🔔 Realtime update v2.0:', payload);
          
          // Refetch quando há mudanças
          fetchInstances();
        }
      )
      .subscribe();

    return () => {
      console.log('[Instances Data] 🧹 Cleanup realtime v2.0');
      supabase.removeChannel(channel);
    };
  }, [fetchInstances]);

  const refetch = useCallback(async () => {
    console.log('[Instances Data] 🔄 Refetch manual v2.0');
    await fetchInstances();
  }, [fetchInstances]);

  return {
    instances,
    isLoading,
    error,
    fetchInstances,
    refetch
  };
};
