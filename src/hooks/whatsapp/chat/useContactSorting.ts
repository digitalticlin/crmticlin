
import { useCallback } from 'react';
import { Contact } from '@/types/chat';

/**
 * Hook para ordenação de contatos
 */
export const useContactSorting = () => {
  const sortContacts = useCallback((contactsList: Contact[]) => {
    return [...contactsList].sort((a, b) => {
      // Conversas não lidas primeiro
      if (a.unreadCount && a.unreadCount > 0 && (!b.unreadCount || b.unreadCount === 0)) return -1;
      if ((!a.unreadCount || a.unreadCount === 0) && b.unreadCount && b.unreadCount > 0) return 1;
      
      // Depois ordenar por última mensagem (mais recente primeiro)
      if (!a.lastMessageTime && !b.lastMessageTime) return 0;
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      
      // Comparar timestamps convertidos para números para ordenação correta
      const timeA = new Date(a.lastMessageTime).getTime();
      const timeB = new Date(b.lastMessageTime).getTime();
      return timeB - timeA;
    });
  }, []);

  return { sortContacts };
};
