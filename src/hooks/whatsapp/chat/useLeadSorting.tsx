import { Contact } from '@/types/chat';

export const useLeadSorting = () => {
  const sortLeadsByRecentMessage = (leads: Contact[]): Contact[] => {
    return [...leads].sort((a, b) => {
      // 1º PRIORIDADE: Mensagens não lidas (mais urgente no topo)
      const aHasUnread = a.unreadCount && a.unreadCount > 0;
      const bHasUnread = b.unreadCount && b.unreadCount > 0;
      
      if (aHasUnread && !bHasUnread) return -1;
      if (!aHasUnread && bHasUnread) return 1;
      
      // 2º PRIORIDADE: Última mensagem mais recente
      if (a.lastMessageTime && b.lastMessageTime) {
        // Converter para timestamp para comparação precisa
        const timeA = new Date(a.lastMessageTime).getTime();
        const timeB = new Date(b.lastMessageTime).getTime();
        
        if (!isNaN(timeA) && !isNaN(timeB)) {
          return timeB - timeA; // Mais recente primeiro (ordem DESC)
        }
      }
      
      // 3º PRIORIDADE: Quem tem data de mensagem sobe
      if (a.lastMessageTime && !b.lastMessageTime) return -1;
      if (!a.lastMessageTime && b.lastMessageTime) return 1;
      
      // 4º PRIORIDADE: Ordenação alfabética
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
