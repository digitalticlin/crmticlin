
import { useEffect } from 'react';

interface UseRealtimeMessagesProps {
  selectedContact: any | null;
  activeInstanceId: string | null;
  onNewMessage: () => void;
  onContactUpdate: () => void;
}

/**
 * Hook simplificado - toda a lógica de tempo real foi consolidada no useRealtimeManager
 * Este hook é mantido apenas para compatibilidade com componentes existentes
 */
export const useRealtimeMessages = ({
  selectedContact,
  activeInstanceId,
  onNewMessage,
  onContactUpdate
}: UseRealtimeMessagesProps) => {
  
  useEffect(() => {
    console.log('[Realtime Messages] All realtime logic has been consolidated in useRealtimeManager');
    console.log('[Realtime Messages] This hook is now a placeholder for compatibility');
    
    // A lógica foi movida para useRealtimeManager e outros hooks específicos
    // Este hook não faz mais subscrições diretas para evitar conflitos
  }, [selectedContact, activeInstanceId, onNewMessage, onContactUpdate]);
};
