
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebInstance } from '@/types/whatsapp';

export const useInstancesData = () => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstances = useCallback(async () => {
    try {
      console.log('[Instances Data] 📊 Buscando instâncias - SEM POLLING AUTOMÁTICO v3.0...');
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

      console.log('[Instances Data] ✅ Instâncias carregadas v3.0:', data?.length || 0);
      setInstances(data || []);

    } catch (error: any) {
      console.error('[Instances Data] ❌ Erro inesperado v3.0:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch inicial
  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  // CORREÇÃO CRÍTICA: Realtime apenas para mudanças importantes, não para polling de QR
  useEffect(() => {
    console.log('[Instances Data] 🔄 Configurando realtime CONTROLADO v3.0...');
    
    const channel = supabase
      .channel('whatsapp_instances_realtime_controlled')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances'
        },
        (payload) => {
          console.log('[Instances Data] 🔔 Realtime update CONTROLADO v3.0:', payload);
          
          // CORREÇÃO: Só refetch para mudanças importantes (não QR Code)
          if (payload.eventType === 'INSERT' || 
              payload.eventType === 'DELETE' || 
              (payload.eventType === 'UPDATE' && payload.new?.connection_status !== payload.old?.connection_status)) {
            console.log('[Instances Data] ♻️ Refetch por mudança importante');
            fetchInstances();
          } else {
            console.log('[Instances Data] ⏭️ Ignorando mudança menor (QR Code, etc.)');
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[Instances Data] 🧹 Cleanup realtime v3.0');
      supabase.removeChannel(channel);
    };
  }, [fetchInstances]);

  const refetch = useCallback(async () => {
    console.log('[Instances Data] 🔄 Refetch manual v3.0');
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
