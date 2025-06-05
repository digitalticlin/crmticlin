
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyData } from '@/hooks/useCompanyData';
import type { WhatsAppWebInstance } from './useWhatsAppWebInstances';

export const useInstancesData = () => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { companyId } = useCompanyData();
  
  // CORREÇÃO: Refs simples sem timeouts complexos
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // CORREÇÃO: Fetch simples sem debounce excessivo
  const fetchInstances = useCallback(async (): Promise<WhatsAppWebInstance[]> => {
    if (!companyId || !isMountedRef.current) {
      console.log('[Instances Data] ⏭️ Fetch ignorado - sem empresa ou desmontado');
      return [];
    }

    const now = Date.now();
    const timeSinceLast = now - lastFetchRef.current;
    
    // CORREÇÃO: Debounce reduzido para 200ms
    if (timeSinceLast < 200) {
      console.log('[Instances Data] ⏸️ Fetch debounced');
      return instances;
    }

    try {
      setIsLoading(true);
      setError(null);
      lastFetchRef.current = now;

      console.log('[Instances Data] 📊 Buscando instâncias:', companyId);

      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', companyId)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (!isMountedRef.current) return [];

      if (fetchError) {
        throw fetchError;
      }

      const mappedInstances: WhatsAppWebInstance[] = (data || []).map(instance => ({
        id: instance.id,
        instance_name: instance.instance_name,
        connection_type: instance.connection_type || 'web',
        server_url: instance.server_url || '',
        vps_instance_id: instance.vps_instance_id || '',
        web_status: instance.web_status || '',
        connection_status: instance.connection_status || '',
        qr_code: instance.qr_code,
        phone: instance.phone,
        profile_name: instance.profile_name,
        profile_pic_url: instance.profile_pic_url,
        date_connected: instance.date_connected,
        date_disconnected: instance.date_disconnected,
        company_id: instance.company_id
      }));

      console.log(`[Instances Data] ✅ ${mappedInstances.length} instâncias carregadas`);
      
      if (isMountedRef.current) {
        setInstances(mappedInstances);
      }
      
      return mappedInstances;
      
    } catch (error: any) {
      if (isMountedRef.current) {
        console.error('[Instances Data] ❌ Erro no fetch:', error);
        setError(error.message);
      }
      return [];
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [companyId, instances]);

  // CORREÇÃO: Real-time simples sem debounce excessivo
  useEffect(() => {
    if (!companyId || !isMountedRef.current) return;

    console.log('[Instances Data] 🔄 Configurando real-time:', companyId);

    const channel = supabase
      .channel(`whatsapp-instances-data-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          if (!isMountedRef.current) return;
          
          console.log('[Instances Data] 📡 Real-time update:', payload);
          
          // CORREÇÃO: Update imediato sem timeout
          fetchInstances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, fetchInstances]);

  // CORREÇÃO: Initial fetch simples
  useEffect(() => {
    if (companyId && isMountedRef.current) {
      fetchInstances();
    }
  }, [companyId]);

  return {
    instances,
    isLoading,
    error,
    fetchInstances,
    refetch: fetchInstances
  };
};
