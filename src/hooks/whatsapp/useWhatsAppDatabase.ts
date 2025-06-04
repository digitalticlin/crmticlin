
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppWebInstance } from './useWhatsAppWebInstances';

export const useWhatsAppDatabase = (companyId?: string | null, companyLoading?: boolean) => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstances = async () => {
    console.log('[useWhatsAppDatabase] Fetching instances from database only...');
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Get user company
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile?.company_id) return;

      // Fetch instances
      const { data: instancesData } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('connection_type', 'web');

      if (instancesData) {
        // Transform database data to match interface
        const transformedInstances: WhatsAppWebInstance[] = instancesData.map(instance => ({
          id: instance.id,
          instance_name: instance.instance_name,
          phone: instance.phone,
          company_id: instance.company_id,
          connection_status: instance.connection_status,
          web_status: instance.web_status || '',
          qr_code: instance.qr_code,
          vps_instance_id: instance.vps_instance_id || '',
          server_url: instance.server_url || '',
          created_at: instance.created_at,
          updated_at: instance.updated_at,
          profile_name: instance.profile_name,
          profile_pic_url: instance.profile_pic_url,
          connection_type: instance.connection_type
        }));
        
        setInstances(transformedInstances);
        console.log('[useWhatsAppDatabase] Instances loaded from DB:', transformedInstances.length);
      }
    } catch (error) {
      console.error('[useWhatsAppDatabase] Error fetching instances:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instanceId);

      if (error) throw error;

      // Remove from local state
      setInstances(prev => prev.filter(instance => instance.id !== instanceId));
      
      console.log('[useWhatsAppDatabase] Instance deleted from database');
    } catch (error) {
      console.error('[useWhatsAppDatabase] Error deleting instance:', error);
      throw error;
    }
  };

  const getActiveInstance = () => {
    if (instances.length === 0) return undefined;
    
    // Get the first connected instance or the first one available
    const connectedInstance = instances.find(
      instance => instance.connection_status === 'connected'
    );
    
    return connectedInstance || instances[0];
  };

  useEffect(() => {
    console.log('[useWhatsAppDatabase] Setting up realtime subscription for instances...');
    
    fetchInstances();

    const channel = supabase
      .channel('whatsapp-instances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances'
        },
        () => {
          fetchInstances();
        }
      )
      .subscribe();

    return () => {
      console.log('[useWhatsAppDatabase] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    instances,
    loading,
    deleteInstance,
    getActiveInstance,
    refetchInstances: fetchInstances
  };
};
