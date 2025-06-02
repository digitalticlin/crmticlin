
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebInstance } from './useWhatsAppWebInstances';

/**
 * Hook para obter a instância WhatsApp ativa do usuário atual
 */
export const useActiveWhatsAppInstance = (companyId: string | null) => {
  const [activeInstance, setActiveInstance] = useState<WhatsAppWebInstance | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;

    const fetchActiveInstance = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('company_id', companyId)
          .eq('connection_type', 'web')
          .eq('connection_status', 'connected')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const instance = data[0];
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
          setActiveInstance(null);
        }
      } catch (error) {
        console.error('Error fetching active WhatsApp instance:', error);
        setActiveInstance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveInstance();
  }, [companyId]);

  return { activeInstance, loading };
};
