
import { useEffect, useCallback } from 'react';
import { UnreadMessagesService } from '@/services/whatsapp/unreadMessagesService';
import { Contact } from '@/types/chat';

interface UseUnreadMessageSyncProps {
  selectedContact: Contact | null;
  isActive: boolean; // Se o chat está ativo/visível
  onSyncComplete?: () => void;
}

export const useUnreadMessageSync = ({
  selectedContact,
  isActive,
  onSyncComplete
}: UseUnreadMessageSyncProps) => {
  
  const markContactAsRead = useCallback(async (contactId: string) => {
    try {
      console.log('[Unread Message Sync] Marcando mensagens como lidas para:', contactId);
      const success = await UnreadMessagesService.markAsRead(contactId);
      
      if (success && onSyncComplete) {
        onSyncComplete();
      }
      
      return success;
    } catch (error) {
      console.error('[Unread Message Sync] Erro ao marcar como lida:', error);
      return false;
    }
  }, [onSyncComplete]);

  // Marcar como lida automaticamente quando o contato é selecionado e o chat está ativo
  useEffect(() => {
    if (selectedContact?.id && isActive && selectedContact.unreadCount && selectedContact.unreadCount > 0) {
      console.log('[Unread Message Sync] Auto-marcando contato como lido:', selectedContact.name);
      
      // Delay pequeno para garantir que o usuário realmente "viu" as mensagens
      const timeoutId = setTimeout(() => {
        markContactAsRead(selectedContact.id);
      }, 1000); // 1 segundo de delay
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedContact?.id, isActive, selectedContact?.unreadCount, markContactAsRead]);

  return {
    markContactAsRead
  };
};
