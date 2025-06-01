
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebInstance } from "../types/whatsappWebInstanceTypes";

export class InstanceDataService {
  static async fetchInstances(companyId: string): Promise<WhatsAppWebInstance[]> {
    console.log('[InstanceDataService] Fetching instances for company:', companyId);

    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('company_id', companyId)
      .eq('connection_type', 'web')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[InstanceDataService] Fetch error:', error);
      throw new Error(error.message);
    }

    console.log('[InstanceDataService] Fetched instances:', data);
    return data || [];
  }

  static setupRealtimeSubscription(companyId: string, onUpdate: () => void) {
    console.log('[InstanceDataService] Setting up realtime subscription for company:', companyId);

    const channel = supabase
      .channel('whatsapp-web-instances')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          console.log('[InstanceDataService] Realtime change received:', payload);
          
          // Immediate refresh for real-time responsiveness
          setTimeout(() => {
            onUpdate();
          }, 1000);
        }
      )
      .subscribe((status) => {
        console.log('[InstanceDataService] Realtime subscription status:', status);
      });

    return () => {
      console.log('[InstanceDataService] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }
}
