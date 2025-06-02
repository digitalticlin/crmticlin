
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWhatsAppInstanceState, useWhatsAppInstanceActions } from './whatsappInstanceStore';
import { toast } from 'sonner';

export const useWhatsAppRealtime = (userEmail: string) => {
  const { instances } = useWhatsAppInstanceState();
  const { updateInstance, refetch } = useWhatsAppInstanceActions();
  const lastUpdateRef = useRef<number>(0);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!userEmail) return;

    console.log('[WhatsApp Realtime] Setting up comprehensive realtime subscription');
    
    // Canal para instâncias do WhatsApp
    const instancesChannel = supabase
      .channel('whatsapp-instances-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances'
        },
        (payload) => {
          console.log('[WhatsApp Realtime] Instance change:', payload);
          handleInstanceChange(payload);
        }
      )
      .subscribe();

    // Canal para mensagens
    const messagesChannel = supabase
      .channel('whatsapp-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('[WhatsApp Realtime] New message:', payload);
          handleNewMessage(payload);
        }
      )
      .subscribe();

    // Canal para leads
    const leadsChannel = supabase
      .channel('whatsapp-leads-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('[WhatsApp Realtime] Lead change:', payload);
          handleLeadChange(payload);
        }
      )
      .subscribe();

    const handleInstanceChange = (payload: any) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < 2000) {
        console.log('[WhatsApp Realtime] Instance update debounced');
        return;
      }

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        processInstanceUpdate(payload);
        lastUpdateRef.current = Date.now();
      }, 500);
    };

    const handleNewMessage = (payload: any) => {
      const messageData = payload.new;
      
      // Notificar nova mensagem se não for do usuário
      if (!messageData.from_me) {
        toast.info(`Nova mensagem recebida`, {
          description: `${messageData.text || 'Mídia'}`
        });
      }
    };

    const handleLeadChange = (payload: any) => {
      console.log('[WhatsApp Realtime] Lead update processed');
      // Aqui pode implementar lógica adicional para leads se necessário
    };

    const processInstanceUpdate = (payload: any) => {
      const instancePrefix = userEmail.split('@')[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
      
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        const newRecord = payload.new as any;
        
        if (newRecord.instance_name?.toLowerCase().startsWith(instancePrefix)) {
          // Notificar mudanças importantes de status
          if (payload.eventType === 'UPDATE' && payload.old) {
            const oldStatus = payload.old.connection_status;
            const newStatus = newRecord.connection_status;
            
            if (oldStatus !== newStatus) {
              if (newStatus === 'open') {
                toast.success(`WhatsApp conectado`, {
                  description: `Instância ${newRecord.instance_name} está pronta`
                });
              } else if (newStatus === 'disconnected') {
                toast.warning(`WhatsApp desconectado`, {
                  description: `Instância ${newRecord.instance_name} foi desconectada`
                });
              }
            }
          }

          // Atualizar estado local
          const mappedInstance = {
            id: newRecord.id,
            instanceName: newRecord.instance_name,
            connected: newRecord.connection_status === 'open',
            qrCodeUrl: newRecord.qr_code,
            phoneNumber: newRecord.phone,
            vps_instance_id: newRecord.vps_instance_id,
            phone: newRecord.phone || "",
            connection_status: newRecord.connection_status || "disconnected",
            web_status: newRecord.web_status || "",
            company_id: newRecord.company_id,
            connection_type: newRecord.connection_type || "web",
            server_url: newRecord.server_url || "",
            owner_jid: newRecord.owner_jid,
            profile_name: newRecord.profile_name,
            profile_pic_url: newRecord.profile_pic_url,
            client_name: newRecord.client_name,
            date_connected: newRecord.date_connected,
            date_disconnected: newRecord.date_disconnected,
            created_at: newRecord.created_at,
            updated_at: newRecord.updated_at
          };

          updateInstance(newRecord.id, mappedInstance);
        }
      }
    };

    return () => {
      console.log('[WhatsApp Realtime] Cleaning up comprehensive subscriptions');
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      supabase.removeChannel(instancesChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(leadsChannel);
    };
  }, [userEmail, updateInstance]);

  return {
    isConnected: instances.length > 0
  };
};
