
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppWebInstance, WhatsAppConnectionStatus } from '@/types/whatsapp';
import { useAuth } from '@/contexts/AuthContext';

export const useWhatsAppSettingsLogic = () => {
  const { user } = useAuth();
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInstances = async () => {
    if (!user?.id) {
      setInstances([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('created_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data with proper type casting
      const transformedInstances: WhatsAppWebInstance[] = (data || []).map(instance => ({
        ...instance,
        connection_status: (instance.connection_status || 'disconnected') as WhatsAppConnectionStatus,
        created_at: instance.created_at || new Date().toISOString(),
        updated_at: instance.updated_at || new Date().toISOString(),
        history_imported: false
      }));

      setInstances(transformedInstances);
    } catch (error) {
      console.error('Error fetching WhatsApp instances:', error);
      setInstances([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, [user?.id]);

  return {
    instances,
    isLoading,
    fetchInstances,
    refetch: fetchInstances
  };
};
