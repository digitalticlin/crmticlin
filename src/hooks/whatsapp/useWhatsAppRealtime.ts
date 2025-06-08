
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWhatsAppInstanceState, useWhatsAppInstanceActions } from './whatsappInstanceStore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useWhatsAppRealtime = () => {
  const { user } = useAuth();
  const { instances } = useWhatsAppInstanceState();
  const { updateInstance } = useWhatsAppInstanceActions();
  
  // CORREÇÃO: Refs simples sem debounce complexo
  const channelRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user?.id || !isMountedRef.current) return;

    console.log('[WhatsApp Realtime] 🔄 Configurando real-time para usuário:', user.id);
    
    // CORREÇÃO: Remover canal anterior se existir
    if (channelRef.current) {
      console.log('[WhatsApp Realtime] 🧹 Removendo canal anterior');
      supabase.removeChannel(channelRef.current);
    }

    // Canal consolidado filtrado por created_by_user_id
    channelRef.current = supabase
      .channel(`whatsapp-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `created_by_user_id=eq.${user.id}` // CORREÇÃO: Filtrar por created_by_user_id
        },
        (payload) => {
          if (!isMountedRef.current) return;
          console.log('[WhatsApp Realtime] 📡 Instance change:', payload);
          processInstanceUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          if (!isMountedRef.current) return;
          console.log('[WhatsApp Realtime] 💬 New message:', payload);
          handleNewMessage(payload);
        }
      )
      .subscribe();

    const handleNewMessage = (payload: any) => {
      const messageData = payload.new;
      
      // Notificar apenas mensagens importantes
      if (!messageData.from_me && messageData.text) {
        toast.info(`Nova mensagem recebida`, {
          description: `${messageData.text.substring(0, 50)}${messageData.text.length > 50 ? '...' : ''}`,
          duration: 3000
        });
      }
    };

    const processInstanceUpdate = (payload: any) => {
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        const newRecord = payload.new as any;
        
        // CORREÇÃO: Verificar se a instância pertence ao usuário atual
        if (newRecord.created_by_user_id === user.id) {
          const isConnected = ['open', 'ready', 'connected'].includes(newRecord.connection_status);

          // Log apenas mudanças significativas de status
          if (payload.eventType === 'UPDATE' && payload.old) {
            const oldStatus = payload.old.connection_status;
            const newStatus = newRecord.connection_status;
            
            if (oldStatus !== newStatus) {
              console.log('[WhatsApp Realtime] 📊 Status change:', { 
                instance: newRecord.instance_name,
                oldStatus, 
                newStatus
              });
              
              // Notificações apenas para mudanças críticas
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

          // Atualizar estado local
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

    // CORREÇÃO: Cleanup simples
    return () => {
      console.log('[WhatsApp Realtime] 🧹 Cleanup executado');
      isMountedRef.current = false;
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, updateInstance]);

  return {
    isConnected: instances.length > 0,
    activeChannels: channelRef.current ? 1 : 0
  };
};
