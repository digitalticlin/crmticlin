import { useEffect } from 'react';
import { supabase } from '../../../integrations/supabase/client';
import { Message } from '../../../types/chat';

export const useWhatsAppMessagesRealtime = (
  instanceId: string | undefined,
  contactJid: string | undefined,
  onNewMessage: (message: Message) => void
) => {
  useEffect(() => {
    if (!instanceId || !contactJid) return;

    // Criar um canal específico para este chat
    const channel = supabase
      .channel(`messages-${instanceId}-${contactJid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `instance_id=eq.${instanceId} AND remote_jid=eq.${contactJid}`
        },
        (payload) => {
          // Converter o payload para o formato Message
          const newMessage: Message = {
            id: payload.new.id,
            text: payload.new.message,
            fromMe: payload.new.from_me,
            timestamp: payload.new.timestamp,
            status: payload.new.status || 'sent',
            mediaType: payload.new.media_type || 'text',
            mediaUrl: payload.new.media_url,
            isIncoming: !payload.new.from_me
          };
          onNewMessage(newMessage);
        }
      )
      .subscribe();

    // Cleanup: desinscrever do canal quando o componente for desmontado
    return () => {
      supabase.removeChannel(channel);
    };
  }, [instanceId, contactJid, onNewMessage]);
}; 