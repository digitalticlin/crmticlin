
// FASE 3: Utilitário para ordenação de contatos
import { Contact } from '@/types/chat';

export const useContactSorting = () => {
  const sortContacts = (contacts: Contact[]): Contact[] => {
    return [...contacts].sort((a, b) => {
      // Primeiro: contatos com mensagens não lidas
      if (a.unreadCount && !b.unreadCount) return -1;
      if (!a.unreadCount && b.unreadCount) return 1;
      
      // Segundo: ordenar por última mensagem (mais recente primeiro)
      if (a.lastMessageTime && b.lastMessageTime) {
        // Se ambos têm timestamp, comparar
        const timeA = new Date(a.lastMessageTime).getTime();
        const timeB = new Date(b.lastMessageTime).getTime();
        if (!isNaN(timeA) && !isNaN(timeB)) {
          return timeB - timeA;
        }
      }
      
      // Terceiro: ordenar alfabeticamente por nome
      return a.name.localeCompare(b.name);
    });
  };

  return { sortContacts };
};
