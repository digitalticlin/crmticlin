
import { Contact } from '@/types/chat';

export const useLeadSorting = () => {
  const sortLeadsByRecentMessage = (leads: Contact[]): Contact[] => {
    return [...leads].sort((a, b) => {
      // Primeiro: ordenar por mensagens não lidas (mais urgente)
      if (a.unreadCount && !b.unreadCount) return -1;
      if (!a.unreadCount && b.unreadCount) return 1;
      
      // Segundo: ordenar por última mensagem (mais recente primeiro)
      if (a.lastMessageTime && b.lastMessageTime) {
        const timeA = new Date(a.lastMessageTime).getTime();
        const timeB = new Date(b.lastMessageTime).getTime();
        
        if (!isNaN(timeA) && !isNaN(timeB)) {
          return timeB - timeA; // Mais recente primeiro
        }
      }
      
      // Se apenas um tem data de mensagem, priorizar o que tem
      if (a.lastMessageTime && !b.lastMessageTime) return -1;
      if (!a.lastMessageTime && b.lastMessageTime) return 1;
      
      // Terceiro: ordenar alfabeticamente por nome
      return a.name.localeCompare(b.name);
    });
  };

  const sortLeadsForKanban = (leads: Contact[]): Contact[] => {
    // Para o kanban, ordenar primeiro por mensagem mais recente
    return [...leads].sort((a, b) => {
      if (a.lastMessageTime && b.lastMessageTime) {
        const timeA = new Date(a.lastMessageTime).getTime();
        const timeB = new Date(b.lastMessageTime).getTime();
        
        if (!isNaN(timeA) && !isNaN(timeB)) {
          return timeB - timeA; // Mais recente primeiro
        }
      }
      
      return 0;
    });
  };

  return {
    sortLeadsByRecentMessage,
    sortLeadsForKanban
  };
};
