
import { useState, useCallback, useMemo } from 'react';
import { Contact } from '@/types/chat';
import { SelectionState } from '@/types/whatsapp/forward';

interface UseContactSelectionProps {
  contacts: Contact[];
  onSelectionChange: (selectedContacts: Contact[]) => void;
}

export const useContactSelection = ({ 
  contacts, 
  onSelectionChange 
}: UseContactSelectionProps) => {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedContactIds: new Set<string>(),
    searchQuery: '',
    filteredContacts: contacts,
    isAllSelected: false
  });

  // Filtrar contatos baseado na busca
  const filteredContacts = useMemo(() => {
    if (!selectionState.searchQuery.trim()) {
      return contacts;
    }

    const query = selectionState.searchQuery.toLowerCase().trim();
    return contacts.filter(contact => {
      const name = contact.name?.toLowerCase() || '';
      const phone = contact.phone?.toLowerCase() || '';
      return name.includes(query) || phone.includes(query);
    });
  }, [contacts, selectionState.searchQuery]);

  // Verificar se todos estão selecionados
  const isAllSelected = useMemo(() => {
    return filteredContacts.length > 0 && 
           filteredContacts.every(contact => 
             selectionState.selectedContactIds.has(contact.id)
           );
  }, [filteredContacts, selectionState.selectedContactIds]);

  // Obter contatos selecionados
  const selectedContacts = useMemo(() => {
    return contacts.filter(contact => 
      selectionState.selectedContactIds.has(contact.id)
    );
  }, [contacts, selectionState.selectedContactIds]);

  const toggleContact = useCallback((contactId: string) => {
    setSelectionState(prev => {
      const newSelectedIds = new Set(prev.selectedContactIds);
      
      if (newSelectedIds.has(contactId)) {
        newSelectedIds.delete(contactId);
      } else {
        newSelectedIds.add(contactId);
      }

      const newSelectedContacts = contacts.filter(contact => 
        newSelectedIds.has(contact.id)
      );

      onSelectionChange(newSelectedContacts);

      return {
        ...prev,
        selectedContactIds: newSelectedIds,
        isAllSelected: filteredContacts.length > 0 && 
                      filteredContacts.every(contact => newSelectedIds.has(contact.id))
      };
    });
  }, [contacts, filteredContacts, onSelectionChange]);

  const toggleAllContacts = useCallback(() => {
    setSelectionState(prev => {
      const newSelectedIds = new Set(prev.selectedContactIds);
      
      if (isAllSelected) {
        // Desmarcar todos os filtrados
        filteredContacts.forEach(contact => {
          newSelectedIds.delete(contact.id);
        });
      } else {
        // Marcar todos os filtrados
        filteredContacts.forEach(contact => {
          newSelectedIds.add(contact.id);
        });
      }

      const newSelectedContacts = contacts.filter(contact => 
        newSelectedIds.has(contact.id)
      );

      onSelectionChange(newSelectedContacts);

      return {
        ...prev,
        selectedContactIds: newSelectedIds,
        isAllSelected: !isAllSelected
      };
    });
  }, [contacts, filteredContacts, isAllSelected, onSelectionChange]);

  const setSearchQuery = useCallback((query: string) => {
    setSelectionState(prev => ({
      ...prev,
      searchQuery: query
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionState(prev => ({
      ...prev,
      selectedContactIds: new Set(),
      isAllSelected: false
    }));
    onSelectionChange([]);
  }, [onSelectionChange]);

  return {
    filteredContacts,
    selectedContacts,
    selectedContactIds: selectionState.selectedContactIds,
    searchQuery: selectionState.searchQuery,
    isAllSelected,
    selectedCount: selectionState.selectedContactIds.size,
    toggleContact,
    toggleAllContacts,
    setSearchQuery,
    clearSelection
  };
};
