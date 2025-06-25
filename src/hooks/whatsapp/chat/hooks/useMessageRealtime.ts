import { useEffect, useRef, useCallback } from 'react';
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
  const hookId = useRef(`message-realtime-${Date.now()}`).current;
  const debounceTimeoutRef = useRef<any>(null);
  
  // Estabilizar callback com debouncing
  const onMessageUpdateRef = useRef(onMessageUpdate);
  onMessageUpdateRef.current = onMessageUpdate;

  const handleMessageUpdate = useCallback((payload: any) => {
    console.log('[WhatsApp Chat Messages FASE 3] 🔄 Realtime message update:', payload);
    
    if (payload.new && typeof payload.new === 'object' && 'from_me' in payload.new && 'text' in payload.new) {
      const messageData = payload.new as any;
      console.log('[WhatsApp Chat Messages FASE 3] 🔄 Message details:', {
        event: payload.eventType,
        fromMe: messageData.from_me,
        text: messageData.text?.substring(0, 30)
      });
    }
    
    // Debouncing para evitar updates excessivos
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      onMessageUpdateRef.current();
    }, 200);
  }, []);

  useEffect(() => {
    if (!activeInstance || !selectedContact) return;

    console.log('[WhatsApp Chat Messages FASE 3] 🔄 Setting up realtime for messages...');

    registerCallback(
      `${hookId}-${selectedContact.id}-${activeInstance.id}`,
      'messageInsert',
      handleMessageUpdate,
      {
        leadId: selectedContact.id,
        activeInstanceId: activeInstance.id
      }
    );

    return () => {
      console.log('[WhatsApp Chat Messages FASE 3] 🧹 Cleaning up realtime subscription');
      unregisterCallback(`${hookId}-${selectedContact.id}-${activeInstance.id}`);
      
      // Cleanup debounce
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [activeInstance?.id, selectedContact?.id, registerCallback, unregisterCallback, hookId, handleMessageUpdate]);
  
  // Cleanup geral no unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
};
