
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeManager } from '../realtime/useRealtimeManager';
import { toast } from 'sonner';

export const useWhatsAppNotifications = (companyId: string | null) => {
  const { registerCallback, unregisterCallback } = useRealtimeManager();

  useEffect(() => {
    if (!companyId) return;

    console.log('[WhatsApp Notifications] Setting up notification system');

    const handleInstanceNotification = (payload: any) => {
      const oldRecord = payload.old;
      const newRecord = payload.new;

      if (oldRecord && newRecord) {
        if (oldRecord.connection_status !== newRecord.connection_status) {
          const statusMessages = {
            'open': {
              title: '🟢 WhatsApp Conectado',
              description: `${newRecord.instance_name} está online e pronto para uso`,
              type: 'success'
            },
            'disconnected': {
              title: '🔴 WhatsApp Desconectado',
              description: `${newRecord.instance_name} foi desconectado`,
              type: 'error'
            },
            'waiting_scan': {
              title: '📱 QR Code Gerado',
              description: `Escaneie o QR code para conectar ${newRecord.instance_name}`,
              type: 'info'
            },
            'auth_failure': {
              title: '⚠️ Falha na Autenticação',
              description: `Erro ao autenticar ${newRecord.instance_name}`,
              type: 'error'
            }
          };

          const statusInfo = statusMessages[newRecord.connection_status as keyof typeof statusMessages];
          
          if (statusInfo) {
            if (statusInfo.type === 'success') {
              toast.success(statusInfo.title, {
                description: statusInfo.description,
                duration: 5000
              });
            } else if (statusInfo.type === 'error') {
              toast.error(statusInfo.title, {
                description: statusInfo.description,
                duration: 7000
              });
            } else {
              toast.info(statusInfo.title, {
                description: statusInfo.description,
                duration: 5000
              });
            }
          }
        }

        if (!oldRecord.phone && newRecord.phone) {
          toast.success('📞 Número Registrado', {
            description: `WhatsApp +${newRecord.phone} foi registrado com sucesso`,
            duration: 5000
          });
        }
      }
    };

    const handleMessageNotification = (payload: any) => {
      const messageData = payload.new;
      
      if (!messageData.from_me && messageData.text) {
        supabase
          .from('whatsapp_instances')
          .select('instance_name, company_id')
          .eq('id', messageData.whatsapp_number_id)
          .eq('company_id', companyId)
          .single()
          .then(({ data: instance }) => {
            if (instance) {
              toast.info('💬 Nova Mensagem', {
                description: messageData.text.length > 50 
                  ? `${messageData.text.substring(0, 47)}...`
                  : messageData.text,
                duration: 4000,
                action: {
                  label: 'Ver Chat',
                  onClick: () => {
                    console.log('Navigate to chat:', messageData.lead_id);
                  }
                }
              });
            }
          });
      }
    };

    registerCallback(
      'whatsapp-instance-notifications',
      'instanceUpdate',
      handleInstanceNotification,
      {
        companyId: companyId
      }
    );

    registerCallback(
      'whatsapp-message-notifications',
      'messageInsert',
      handleMessageNotification
    );

    return () => {
      console.log('[WhatsApp Notifications] Cleaning up notification callbacks');
      unregisterCallback('whatsapp-instance-notifications');
      unregisterCallback('whatsapp-message-notifications');
    };
  }, [companyId, registerCallback, unregisterCallback]);
};
