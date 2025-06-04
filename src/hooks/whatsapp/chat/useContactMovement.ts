
// FASE 3: Utilitário para mover contatos para o topo
import { Contact } from '@/types/chat';

export const useContactMovement = () => {
  const moveContactToTop = (contactId: string) => {
    // Esta função será usada para mover um contato para o topo da lista
    // quando ele receber uma nova mensagem
    console.log('[Contact Movement FASE 3] 📍 Moving contact to top:', contactId);
  };

  return { moveContactToTop };
};
