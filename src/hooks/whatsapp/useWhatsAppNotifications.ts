
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWhatsAppNotifications = (companyId: string | null) => {
  useEffect(() => {
    if (!companyId) return;

    console.log('[WhatsApp Notifications] Setting up notification system');

    // Notificações para instâncias
    const instanceNotificationsChannel = supabase
      .channel('instance-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          handleInstanceNotification(payload);
        }
      )
      .subscribe();

    // Notificações para mensagens
    const messageNotificationsChannel = supabase
      .channel('message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          handleMessageNotification(payload);
        }
      )
      .subscribe();

    const handleInstanceNotification = (payload: any) => {
      const oldRecord = payload.old;
      const newRecord = payload.new;

      if (oldRecord && newRecord) {
        // Verificar mudanças de status importantes
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

        // Notificar quando número for registrado
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
      
      // Só notificar mensagens recebidas (não enviadas pelo usuário)
      if (!messageData.from_me && messageData.text) {
        // Verificar se a mensagem é de uma instância da empresa
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
                    // Aqui poderia implementar navegação para o chat
                    console.log('Navigate to chat:', messageData.lead_id);
                  }
                }
              });
            }
          });
      }
    };

    return () => {
      console.log('[WhatsApp Notifications] Cleaning up notification channels');
      supabase.removeChannel(instanceNotificationsChannel);
      supabase.removeChannel(messageNotificationsChannel);
    };
  }, [companyId]);
};
