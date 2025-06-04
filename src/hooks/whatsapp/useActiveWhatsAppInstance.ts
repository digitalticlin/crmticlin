
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebInstance } from './useWhatsAppWebInstances';

/**
 * Hook para obter as instâncias WhatsApp ativas do usuário atual
 * Agora sincroniza com as instâncias configuradas pelo usuário
 */
export const useActiveWhatsAppInstance = (companyId: string | null) => {
  const [activeInstance, setActiveInstance] = useState<WhatsAppWebInstance | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;

    const fetchActiveInstance = async () => {
      setLoading(true);
      try {
        console.log('[useActiveWhatsAppInstance] Fetching instances for company:', companyId);

        // Buscar todas as instâncias da empresa (não apenas as conectadas)
        // Para sincronizar com as configurações do usuário
        const { data, error } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('company_id', companyId)
          .eq('connection_type', 'web')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const instance = data[0];
          console.log('[useActiveWhatsAppInstance] ✅ Instance found:', {
            id: instance.id,
            instanceName: instance.instance_name,
            status: instance.connection_status,
            phone: instance.phone
          });

          setActiveInstance({
            id: instance.id,
            instance_name: instance.instance_name,
            connection_type: 'web',
            server_url: instance.server_url || '',
            vps_instance_id: instance.vps_instance_id || '',
            web_status: instance.web_status || '',
            connection_status: instance.connection_status || '',
            qr_code: instance.qr_code,
            phone: instance.phone,
            profile_name: instance.profile_name,
            company_id: instance.company_id
          });
        } else {
          console.log('[useActiveWhatsAppInstance] No instances found for company');
          setActiveInstance(null);
        }
      } catch (error) {
        console.error('[useActiveWhatsAppInstance] ❌ Error fetching instances:', error);
        setActiveInstance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveInstance();

    // Configurar realtime para sincronizar mudanças nas instâncias
    const channel = supabase
      .channel(`whatsapp-instances-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          console.log('[useActiveWhatsAppInstance] 📡 Instance update received:', payload.eventType);
          fetchActiveInstance();
        }
      )
      .subscribe();

    return () => {
      console.log('[useActiveWhatsAppInstance] 🧹 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  return { activeInstance, loading };
};
