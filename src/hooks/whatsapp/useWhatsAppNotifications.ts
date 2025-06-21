
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeManager } from '../realtime/useRealtimeManager';
import { useCompanyData } from '../useCompanyData';
import { toast } from 'sonner';

export const useWhatsAppNotifications = () => {
  const { registerCallback, unregisterCallback } = useRealtimeManager();
  const { userId } = useCompanyData();

  // Stabilize callback functions with useCallback to prevent infinite re-renders
  const handleInstanceNotification = useCallback((payload: any) => {
    const oldRecord = payload.old;
    const newRecord = payload.new;

    if (oldRecord && newRecord) {
      if (oldRecord.connection_status !== newRecord.connection_status) {
        const statusMessages: Record<string, { title: string; description: string; type: 'success' | 'error' | 'info' }> = {
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

        const statusInfo = statusMessages[newRecord.connection_status];
        
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
  }, []);

  const handleMessageNotification = useCallback((payload: any) => {
    const messageData = payload.new;
    
    if (!messageData.from_me && messageData.text && userId) {
      supabase
        .from('whatsapp_instances')
        .select('instance_name, created_by_user_id')
        .eq('id', messageData.whatsapp_number_id)
        .eq('created_by_user_id', userId)
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
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    console.log('[WhatsApp Notifications] Setting up notification system for user:', userId);

    // Register callbacks with explicit type definitions to avoid circular dependencies
    registerCallback(
      'whatsapp-instance-notifications', 
      'instanceUpdate', 
      handleInstanceNotification, 
      { filters: { created_by_user_id: userId } }
    );

    registerCallback(
      'whatsapp-message-notifications', 
      'messageInsert', 
      handleMessageNotification, 
      {}
    );

    return () => {
      console.log('[WhatsApp Notifications] Cleaning up notification callbacks');
      unregisterCallback('whatsapp-instance-notifications');
      unregisterCallback('whatsapp-message-notifications');
    };
  }, [userId, registerCallback, unregisterCallback, handleInstanceNotification, handleMessageNotification]);
};
