
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { WhatsAppWebInstance } from './useWhatsAppWebInstances';

export const useInstancesData = () => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // CORREÇÃO COMPLETA: Fetch otimizado baseado no user_id
  const fetchInstances = useCallback(async (): Promise<WhatsAppWebInstance[]> => {
    if (!user?.id || !isMountedRef.current) {
      console.log('[Instances Data] ⏭️ CORREÇÃO COMPLETA - Fetch ignorado - sem usuário ou desmontado');
      return [];
    }

    const now = Date.now();
    const timeSinceLast = now - lastFetchRef.current;
    
    // Debounce reduzido para 100ms
    if (timeSinceLast < 100) {
      console.log('[Instances Data] ⏸️ CORREÇÃO COMPLETA - Fetch debounced');
      return instances;
    }

    try {
      setIsLoading(true);
      setError(null);
      lastFetchRef.current = now;

      console.log('[Instances Data] 📊 CORREÇÃO COMPLETA - Buscando instâncias do usuário:', user.id);

      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('created_by_user_id', user.id)
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
        company_id: instance.company_id,
        updated_at: instance.updated_at
      }));

      console.log(`[Instances Data] ✅ CORREÇÃO COMPLETA - ${mappedInstances.length} instâncias carregadas`);
      
      if (isMountedRef.current) {
        setInstances(mappedInstances);
      }
      
      return mappedInstances;
      
    } catch (error: any) {
      if (isMountedRef.current) {
        console.error('[Instances Data] ❌ CORREÇÃO COMPLETA - Erro no fetch:', error);
        setError(error.message);
      }
      return [];
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id, instances]);

  // CORREÇÃO COMPLETA: Real-time otimizado
  useEffect(() => {
    if (!user?.id || !isMountedRef.current) return;

    console.log('[Instances Data] 🔄 CORREÇÃO COMPLETA - Configurando real-time para usuário:', user.id);

    const channel = supabase
      .channel(`whatsapp-instances-data-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `created_by_user_id=eq.${user.id}`
        },
        (payload) => {
          if (!isMountedRef.current) return;
          
          console.log('[Instances Data] 📡 CORREÇÃO COMPLETA - Real-time update:', payload.eventType);
          
          // Update imediato após pequeno delay para sincronização
          setTimeout(() => {
            if (isMountedRef.current) {
              fetchInstances();
            }
          }, 300);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchInstances]);

  // Initial fetch
  useEffect(() => {
    if (user?.id && isMountedRef.current) {
      fetchInstances();
    }
  }, [user?.id]);

  return {
    instances,
    isLoading,
    error,
    fetchInstances,
    refetch: fetchInstances
  };
};
