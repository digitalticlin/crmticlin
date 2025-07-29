
import { useMemo, useState } from 'react';
import { Contact } from '@/types/chat';
import { formatPhoneDisplay } from '@/utils/phoneFormatter';

export const useContactsSearch = (contacts: Contact[]) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;

    const query = searchQuery.toLowerCase();
    return contacts.filter(contact => {
      const displayName = contact.name || formatPhoneDisplay(contact.phone);
      const searchName = displayName.toLowerCase();
      const searchPhone = contact.phone.replace(/\D/g, '');
      const searchQueryNumbers = query.replace(/\D/g, '');

      return (
        searchName.includes(query) ||
        searchPhone.includes(searchQueryNumbers) ||
        (contact.email && contact.email.toLowerCase().includes(query)) ||
        (contact.company && contact.company.toLowerCase().includes(query))
      );
    });
  }, [contacts, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredContacts
  };
};
