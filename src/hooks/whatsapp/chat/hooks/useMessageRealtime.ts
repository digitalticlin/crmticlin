import { useEffect, useRef, useCallback } from 'react';
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { supabase } from '@/integrations/supabase/client';

interface UseMessageRealtimeProps {
  selectedContact: Contact | null;
  activeInstance: WhatsAppWebInstance | null;
  onMessageUpdate: () => void;
}

export const useMessageRealtime = ({
  selectedContact,
  activeInstance,
  onMessageUpdate
}: UseMessageRealtimeProps) => {
  const channelRef = useRef<any>(null);
  const lastContactIdRef = useRef<string | null>(null);
  
  // Callback otimizado com debouncing
  const handleMessageUpdate = useCallback((payload: any) => {
    const newMessage = payload.new;
    
    // Validar se a mensagem é relevante
    if (!selectedContact || !activeInstance) {
      return;
    }
    
    // Verificar se é mensagem do contato atual
    if (newMessage?.lead_id === selectedContact.id && 
        newMessage?.whatsapp_number_id === activeInstance.id) {
      
      // Debouncing para evitar múltiplas atualizações
      setTimeout(() => {
        onMessageUpdate();
      }, 200);
    }
  }, [selectedContact?.id, activeInstance?.id, onMessageUpdate]);

  useEffect(() => {
    // Cleanup channel anterior
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!selectedContact || !activeInstance) {
      return;
    }

    // Criar novo channel para o contato específico
    const channelId = `message-realtime-${selectedContact.id}-${activeInstance.id}`;
    
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `lead_id=eq.${selectedContact.id}`
      }, handleMessageUpdate)
      .subscribe();
    
    channelRef.current = channel;
    lastContactIdRef.current = selectedContact.id;

    // Cleanup ao desmontar ou mudar dependências
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [selectedContact?.id, activeInstance?.id, handleMessageUpdate]);

  // Cleanup geral no unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);
};
