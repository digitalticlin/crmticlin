
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyData } from '@/hooks/useCompanyData';
import type { WhatsAppWebInstance } from './useWhatsAppWebInstances';

export const useInstancesData = () => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { companyId } = useCompanyData();
  
  // CORREÇÃO 7: Refs para controle anti-loop
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // CORREÇÃO 8: Fetch com debounce rigoroso
  const fetchInstances = useCallback(async (): Promise<WhatsAppWebInstance[]> => {
    if (!companyId || !isMountedRef.current) {
      console.log('[Instances Data] ⏭️ Fetch ignorado - sem empresa ou desmontado');
      return [];
    }

    const now = Date.now();
    const timeSinceLast = now - lastFetchRef.current;
    
    // CRÍTICO: Debounce de 5 segundos para prevenir loops
    if (timeSinceLast < 5000) {
      console.log('[Instances Data] ⏸️ Fetch debounced - aguardando', Math.round((5000 - timeSinceLast) / 1000), 's');
      return instances; // Retornar dados atuais
    }

    try {
      setIsLoading(true);
      setError(null);
      lastFetchRef.current = now;

      console.log('[Instances Data] 📊 Buscando instâncias (anti-loop):', companyId);

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

      console.log(`[Instances Data] ✅ ${mappedInstances.length} instâncias carregadas (otimizado)`);
      
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

  // CORREÇÃO 9: Real-time com debounce melhorado
  useEffect(() => {
    if (!companyId || !isMountedRef.current) return;

    console.log('[Instances Data] 🔄 Configurando real-time (anti-loop):', companyId);

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
          
          console.log('[Instances Data] 📡 Real-time update (debounced):', payload);
          
          // CRÍTICO: Debounce para real-time
          if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
          }
          
          fetchTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              fetchInstances();
            }
          }, 2000); // 2 segundos de debounce
        }
      )
      .subscribe();

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [companyId, fetchInstances]);

  // CORREÇÃO 10: Initial fetch controlado
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
