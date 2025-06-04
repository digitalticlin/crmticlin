
import { useCallback } from 'react';
import { Contact } from '@/types/chat';

/**
 * Hook para movimentação de contatos na lista
 */
export const useContactMovement = () => {
  const moveContactToTop = useCallback((
    contactId: string, 
    setContacts: React.Dispatch<React.SetStateAction<Contact[]>>
  ) => {
    setContacts(prevContacts => {
      const contactIndex = prevContacts.findIndex(c => c.id === contactId);
      if (contactIndex === -1) return prevContacts;
      
      const updatedContacts = [...prevContacts];
      const [contact] = updatedContacts.splice(contactIndex, 1);
      
      // Atualizar timestamp da última mensagem para agora
      const updatedContact = {
        ...contact,
        lastMessageTime: new Date().toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      
      // Inserir no topo
      updatedContacts.unshift(updatedContact);
      
      console.log('[WhatsApp Web Chat] 📈 Moved contact to top:', contact.name);
      return updatedContacts;
    });
  }, []);

  return { moveContactToTop };
};
