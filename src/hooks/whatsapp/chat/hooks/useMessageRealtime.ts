
import { useEffect } from 'react';
import { useRealtimeManager } from '../../../realtime/useRealtimeManager';
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
  const { registerCallback, unregisterCallback } = useRealtimeManager();

  useEffect(() => {
    if (!activeInstance || !selectedContact) return;

    console.log('[WhatsApp Chat Messages FASE 3] 🔄 Setting up realtime for messages...');

    const handleMessageUpdate = (payload: any) => {
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
    };

    registerCallback(
      `message-realtime-${selectedContact.id}-${activeInstance.id}`,
      'messageInsert',
      handleMessageUpdate,
      {
        leadId: selectedContact.id,
        activeInstanceId: activeInstance.id
      }
    );

    return () => {
      console.log('[WhatsApp Chat Messages FASE 3] 🧹 Cleaning up realtime subscription');
      unregisterCallback(`message-realtime-${selectedContact.id}-${activeInstance.id}`);
    };
  }, [activeInstance, selectedContact, onMessageUpdate, registerCallback, unregisterCallback]);
};
