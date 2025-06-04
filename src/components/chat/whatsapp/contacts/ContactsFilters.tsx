
import { useState } from "react";
import { Contact } from "@/types/chat";

interface ContactsFiltersProps {
  contacts: Contact[];
  searchQuery: string;
  activeFilter: string;
}

export const useContactsFilters = ({ contacts, searchQuery, activeFilter }: ContactsFiltersProps) => {
  // Filter and sort contacts
  const filteredContacts = contacts
    .filter(contact => {
      // Search filter
      const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           contact.phone.includes(searchQuery);
      
      // Status filter
      const matchesFilter = (() => {
        switch (activeFilter) {
          case "unread":
            return contact.unreadCount && contact.unreadCount > 0;
          case "archived":
            return false; // Implementar arquivados futuramente
          case "groups":
            return false; // Implementar grupos futuramente
          default:
            return true;
        }
      })();

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Ordenar por última mensagem (mais recente primeiro)
      if (!a.lastMessageTime && !b.lastMessageTime) return 0;
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      
      // Conversões não lidas primeiro
      if (a.unreadCount && !b.unreadCount) return -1;
      if (!a.unreadCount && b.unreadCount) return 1;
      
      return b.lastMessageTime.localeCompare(a.lastMessageTime);
    });

  return filteredContacts;
};
