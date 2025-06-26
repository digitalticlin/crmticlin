
import { useEffect, useRef, useCallback } from 'react';
import { useRealtimeManager } from '../../realtime/useRealtimeManager';
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';

interface UseWhatsAppChatRealtimeProps {
  activeInstance: WhatsAppWebInstance | null;
  selectedContact: Contact | null;
  onMessageReceived: (leadId: string) => void;
  onContactUpdate: () => void;
  onMoveContactToTop: (contactId: string) => void;
}

export const useWhatsAppChatRealtime = ({
  activeInstance,
  selectedContact,
  onMessageReceived,
  onContactUpdate,
  onMoveContactToTop
}: UseWhatsAppChatRealtimeProps) => {
  const { registerCallback, unregisterCallback } = useRealtimeManager();
  const hookId = useRef(`whatsapp-chat-realtime-${Date.now()}`).current;
  
  // Debounce refs para otimização
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  
  // Estabilizar callbacks
  const onMessageReceivedRef = useRef(onMessageReceived);
  const onContactUpdateRef = useRef(onContactUpdate);
  const onMoveContactToTopRef = useRef(onMoveContactToTop);
  
  onMessageReceivedRef.current = onMessageReceived;
  onContactUpdateRef.current = onContactUpdate;
  onMoveContactToTopRef.current = onMoveContactToTop;

  // Callback otimizado para novas mensagens
  const handleMessageInsert = useCallback((payload: any) => {
    const now = Date.now();
    const messageData = payload.new as any;
    
    console.log('[WhatsApp Chat Realtime] 📩 Nova mensagem recebida:', {
      leadId: messageData.lead_id,
      fromMe: messageData.from_me,
      selectedContactId: selectedContact?.id
    });

    // Debouncing inteligente - mais rápido para mensagem do contato selecionado
    const debounceTime = (selectedContact && messageData.lead_id === selectedContact.id) ? 100 : 300;
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      // Evitar updates muito frequentes
      if (now - lastUpdateRef.current < 50) return;
      lastUpdateRef.current = now;

      // Se é mensagem para o contato selecionado, atualizar mensagens
      if (selectedContact && messageData.lead_id === selectedContact.id) {
        onMessageReceivedRef.current(messageData.lead_id);
      }

      // Sempre mover contato para o topo e atualizar lista
      if (messageData.lead_id) {
        onMoveContactToTopRef.current(messageData.lead_id);
        onContactUpdateRef.current();
      }
    }, debounceTime);
  }, [selectedContact?.id]);

  // Callback para atualizações de lead (contador não lido, etc)
  const handleLeadUpdate = useCallback((payload: any) => {
    const leadData = payload.new as any;
    
    console.log('[WhatsApp Chat Realtime] 📝 Lead atualizado:', {
      leadId: leadData.id,
      unreadCount: leadData.unread_count
    });

    // Debounce para updates de lead
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      onContactUpdateRef.current();
    }, 200);
  }, []);

  // Callback para novos leads
  const handleLeadInsert = useCallback((payload: any) => {
    console.log('[WhatsApp Chat Realtime] 🆕 Novo lead criado:', payload.new);
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      onContactUpdateRef.current();
    }, 300);
  }, []);

  useEffect(() => {
    if (!activeInstance?.id) return;

    console.log('[WhatsApp Chat Realtime] 🔄 Configurando tempo real para instância:', activeInstance.instance_name);

    // Registrar callbacks otimizados
    registerCallback(`${hookId}-message-insert`, 'messageInsert', handleMessageInsert, {
      activeInstanceId: activeInstance.id
    });
    registerCallback(`${hookId}-lead-update`, 'leadUpdate', handleLeadUpdate);
    registerCallback(`${hookId}-lead-insert`, 'leadInsert', handleLeadInsert);

    return () => {
      console.log('[WhatsApp Chat Realtime] 🧹 Limpando callbacks');
      unregisterCallback(`${hookId}-message-insert`);
      unregisterCallback(`${hookId}-lead-update`);
      unregisterCallback(`${hookId}-lead-insert`);
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [activeInstance?.id, registerCallback, unregisterCallback, hookId, handleMessageInsert, handleLeadUpdate, handleLeadInsert]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
};
