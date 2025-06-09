import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';

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
  useEffect(() => {
    if (!activeInstance || !selectedContact) return;

    console.log('[WhatsApp Chat Messages FASE 3] 🔄 Setting up realtime for messages...');

    const channel = supabase
      .channel(`messages-${selectedContact.id}-${activeInstance.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${selectedContact.id}`
        },
        (payload) => {
          console.log('[WhatsApp Chat Messages FASE 3] 🔄 Realtime message update:', payload);
          
          if (payload.new && typeof payload.new === 'object' && 'from_me' in payload.new && 'text' in payload.new) {
            const messageData = payload.new as any;
            console.log('[WhatsApp Chat Messages FASE 3] 🔄 Message details:', {
              event: payload.eventType,
              fromMe: messageData.from_me,
              text: messageData.text?.substring(0, 30)
            });
          }
          
          setTimeout(() => onMessageUpdate(), 200);
        }
      )
      .subscribe();

    return () => {
      console.log('[WhatsApp Chat Messages FASE 3] 🧹 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [activeInstance, selectedContact, onMessageUpdate]);
};
