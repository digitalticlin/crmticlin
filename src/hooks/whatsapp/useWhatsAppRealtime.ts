
import { useUnifiedRealtime } from '../realtime/useUnifiedRealtime';
import { useWhatsAppInstanceState, useWhatsAppInstanceActions } from './whatsappInstanceStore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useWhatsAppRealtime = () => {
  const { user } = useAuth();
  const { instances } = useWhatsAppInstanceState();
  const { updateInstance } = useWhatsAppInstanceActions();

  const handleInstanceUpdate = (payload: any) => {
    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
      const newRecord = payload.new as any;
      
      // Verify instance belongs to current user
      if (newRecord.created_by_user_id === user?.id) {
        const isConnected = ['open', 'ready', 'connected'].includes(newRecord.connection_status);

        // Log significant status changes
        if (payload.eventType === 'UPDATE' && payload.old) {
          const oldStatus = payload.old.connection_status;
          const newStatus = newRecord.connection_status;
          
          if (oldStatus !== newStatus) {
            console.log('[WhatsApp Realtime] Status change:', { 
              instance: newRecord.instance_name,
              oldStatus, 
              newStatus
            });
            
            // Show notifications for critical changes
            if (oldStatus === 'connecting' && isConnected) {
              toast.success(`WhatsApp conectado`, {
                description: `${newRecord.instance_name} está pronto`,
                duration: 5000
              });
            } else if (isConnected && newStatus === 'disconnected') {
              toast.warning(`WhatsApp desconectado`, {
                description: `${newRecord.instance_name} foi desconectada`,
                duration: 5000
              });
            }
          }
        }

        // Update local state
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
    
    // Show notification for important messages
    if (!messageData.from_me && messageData.text) {
      toast.info(`Nova mensagem recebida`, {
        description: `${messageData.text.substring(0, 50)}${messageData.text.length > 50 ? '...' : ''}`,
        duration: 3000
      });
    }
  };

  const { isConnected, activeChannels } = useUnifiedRealtime({
    onInstanceUpdate: handleInstanceUpdate,
    onMessageInsert: handleNewMessage
  });

  return {
    isConnected: instances.length > 0,
    activeChannels
  };
};
