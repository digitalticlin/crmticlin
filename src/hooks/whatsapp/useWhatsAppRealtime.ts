
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWhatsAppInstanceState, useWhatsAppInstanceActions } from './whatsappInstanceStore';

export const useWhatsAppRealtime = (userEmail: string) => {
  const { instances } = useWhatsAppInstanceState();
  const { updateInstance } = useWhatsAppInstanceActions();

  useEffect(() => {
    if (!userEmail) return;

    console.log('[WhatsApp Realtime] Setting up realtime subscription');
    
    const channel = supabase
      .channel('whatsapp-instances-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'whatsapp_instances'
        },
        (payload) => {
          console.log('[WhatsApp Realtime] Received change:', payload);
          
          const instancePrefix = userEmail.split('@')[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newRecord = payload.new as any;
            
            // Verificar se a instância pertence ao usuário atual
            if (newRecord.instance_name?.toLowerCase().startsWith(instancePrefix)) {
              const mappedInstance = {
                id: newRecord.id,
                instanceName: newRecord.instance_name,
                connected: newRecord.connection_status === 'open',
                qrCodeUrl: newRecord.qr_code,
                phoneNumber: newRecord.phone,
                evolution_instance_name: newRecord.evolution_instance_name,
                evolution_instance_id: newRecord.evolution_instance_id,
                phone: newRecord.phone || "",
                connection_status: newRecord.connection_status || "disconnected",
                owner_jid: newRecord.owner_jid,
                profile_name: newRecord.profile_name,
                profile_pic_url: newRecord.profile_pic_url,
                client_name: newRecord.client_name,
                date_connected: newRecord.date_connected,
                date_disconnected: newRecord.date_disconnected,
                created_at: newRecord.created_at,
                updated_at: newRecord.updated_at
              };

              if (payload.eventType === 'UPDATE') {
                updateInstance(newRecord.id, mappedInstance);
                console.log('[WhatsApp Realtime] Updated instance:', newRecord.id);
              } else if (payload.eventType === 'INSERT') {
                console.log('[WhatsApp Realtime] New instance inserted:', newRecord.id);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[WhatsApp Realtime] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [userEmail, updateInstance]);
};
