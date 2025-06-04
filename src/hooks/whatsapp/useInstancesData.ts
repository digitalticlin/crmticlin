
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyData } from '@/hooks/useCompanyData';
import type { WhatsAppWebInstance } from './useWhatsAppWebInstances';

export const useInstancesData = () => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { companyId } = useCompanyData();

  // Fetch instances from database
  const fetchInstances = useCallback(async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('[Instances Data] 📋 Buscando instâncias da empresa:', companyId);

      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', companyId)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      console.log('[Instances Data] ✅ Instâncias carregadas:', data?.length || 0);
      setInstances(data || []);

    } catch (err: any) {
      console.error('[Instances Data] ❌ Erro ao buscar instâncias:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  // Real-time subscriptions for instance updates
  useEffect(() => {
    if (!companyId) return;

    console.log('[Instances Data] 🔄 Configurando real-time updates para empresa:', companyId);

    const channel = supabase
      .channel('whatsapp-instances-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          console.log('[Instances Data] 📡 Real-time update:', payload);
          fetchInstances(); // Recarregar dados quando houver mudanças
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, fetchInstances]);

  // Initial fetch
  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  return {
    instances,
    isLoading,
    error,
    fetchInstances,
    refetch: fetchInstances
  };
};
