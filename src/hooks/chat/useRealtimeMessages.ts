
import { useEffect } from 'react';

interface UseRealtimeMessagesProps {
  selectedContact: any | null;
  activeInstanceId: string | null;
  onNewMessage: () => void;
  onContactUpdate: () => void;
}

/**
 * Hook simplificado - agora a lógica de tempo real está consolidada no useRealtimeLeads
 * Este hook é mantido para compatibilidade mas não faz subscrições duplicadas
 */
export const useRealtimeMessages = ({
  selectedContact,
  activeInstanceId,
  onNewMessage,
  onContactUpdate
}: UseRealtimeMessagesProps) => {
  
  useEffect(() => {
    console.log('[Realtime Messages] Hook initialized but logic moved to useRealtimeLeads to avoid duplicate subscriptions');
    // A lógica foi movida para useRealtimeLeads para evitar múltiplas subscrições
  }, [selectedContact, activeInstanceId, onNewMessage, onContactUpdate]);
};
