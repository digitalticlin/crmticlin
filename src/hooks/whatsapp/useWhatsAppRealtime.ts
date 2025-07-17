
import { useEffect, useRef } from 'react';
import { useRealtimeManager } from '../realtime/useRealtimeManager';
import { useWhatsAppInstanceState, useWhatsAppInstanceActions } from './whatsappInstanceStore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useWhatsAppRealtime = () => {
  const { user } = useAuth();
  const { instances } = useWhatsAppInstanceState();
  const { updateInstance } = useWhatsAppInstanceActions();
  const { registerCallback, unregisterCallback } = useRealtimeManager();
  const hookId = useRef(`whatsapp-realtime-${Math.random()}`).current;

  useEffect(() => {
    const handleInstanceUpdate = (payload: any) => {
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        const newRecord = payload.new as any;
        
        if (newRecord.created_by_user_id === user?.id) {
          const isConnected = ['open', 'ready', 'connected'].includes(newRecord.connection_status);

          if (payload.eventType === 'UPDATE' && payload.old) {
            const oldStatus = payload.old.connection_status;
            const newStatus = newRecord.connection_status;
            
            if (oldStatus !== newStatus) {
              console.log('[WhatsApp Realtime] Status change:', { 
                instance: newRecord.instance_name,
                oldStatus, 
                newStatus,
                phone: newRecord.phone,
                profileName: newRecord.profile_name
              });
              
              // CORREÇÃO: Detectar conexão com múltiplos status
              const wasDisconnected = !['ready', 'connected', 'open'].includes(oldStatus);
              const isNowConnected = ['ready', 'connected', 'open'].includes(newStatus);
              
              if (wasDisconnected && isNowConnected) {
                const phoneInfo = newRecord.phone ? ` 📱 ${newRecord.phone}` : '';
                const profileInfo = newRecord.profile_name ? ` (${newRecord.profile_name})` : '';
                
                toast.success(`WhatsApp conectado`, {
                  description: `${newRecord.instance_name} está pronto${phoneInfo}${profileInfo}`,
                  duration: 5000
                });
              } else if (['ready', 'connected', 'open'].includes(oldStatus) && newStatus === 'disconnected') {
                toast.warning(`WhatsApp desconectado`, {
                  description: `${newRecord.instance_name} foi desconectada`,
                  duration: 5000
                });
              }
            }
          }

          const mappedInstance = {
            id: newRecord.id,
            instanceName: newRecord.instance_name,
            connected: isConnected,
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

    const handleNewMessage = (payload: any) => {
      const messageData = payload.new;
      
      if (!messageData.from_me && messageData.text) {
        toast.info(`Nova mensagem recebida`, {
          description: `${messageData.text.substring(0, 50)}${messageData.text.length > 50 ? '...' : ''}`,
          duration: 3000
        });
      }
    };

    registerCallback(`${hookId}-instance-update`, 'instanceUpdate', handleInstanceUpdate);
    registerCallback(`${hookId}-message-insert`, 'messageInsert', handleNewMessage);

    return () => {
      unregisterCallback(`${hookId}-instance-update`);
      unregisterCallback(`${hookId}-message-insert`);
    };
  }, [user?.id, updateInstance, registerCallback, unregisterCallback, hookId]);

  return {
    isConnected: instances.length > 0,
    activeChannels: 1
  };
};
