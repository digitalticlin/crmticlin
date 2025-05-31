
import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useWhatsAppRealtime = (companyId?: string, onInstanceChange?: () => void) => {
  useEffect(() => {
    if (!companyId || !onInstanceChange) return;

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
          console.log('WhatsApp Web instance change:', payload);
          
          // Se uma instância foi conectada (status mudou para ready/open), mostrar toast
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newStatus = payload.new.web_status;
            const oldStatus = payload.old?.web_status;
            
            if ((newStatus === 'ready' || newStatus === 'open') && 
                oldStatus !== 'ready' && oldStatus !== 'open') {
              toast.success('WhatsApp conectado com sucesso!');
            }
          }
          
          onInstanceChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, onInstanceChange]);
};
