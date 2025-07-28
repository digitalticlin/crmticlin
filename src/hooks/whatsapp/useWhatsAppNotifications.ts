
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UseWhatsAppNotificationsProps {
  onNewMessage?: (message: any) => void;
  onStatusChange?: (status: any) => void;
}

export const useWhatsAppNotifications = ({
  onNewMessage,
  onStatusChange
}: UseWhatsAppNotificationsProps = {}) => {
  const { user } = useAuth();

  const handleNewMessage = useCallback((payload: any) => {
    console.log('[WhatsApp Notifications] 📨 Nova mensagem:', payload);
    
    if (onNewMessage) {
      onNewMessage(payload.new);
    }
  }, [onNewMessage]);

  const handleStatusChange = useCallback((payload: any) => {
    console.log('[WhatsApp Notifications] 🔄 Status alterado:', payload);
    
    if (onStatusChange) {
      onStatusChange(payload.new);
    }
  }, [onStatusChange]);

  useEffect(() => {
    if (!user?.id) return;

    console.log('[WhatsApp Notifications] 🔌 Configurando notificações do WhatsApp');

    const channel = supabase
      .channel(`whatsapp-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        handleNewMessage
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `created_by_user_id=eq.${user.id}`
        },
        handleStatusChange
      )
      .subscribe();

    return () => {
      console.log('[WhatsApp Notifications] 🧹 Limpando notificações do WhatsApp');
      supabase.removeChannel(channel);
    };
  }, [user?.id, handleNewMessage, handleStatusChange]);

  return {
    // Pode retornar status ou métodos se necessário
  };
};
