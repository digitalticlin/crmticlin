
import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Contact } from '@/types/chat';
import { ContactItem } from './ContactItem';

interface ContactsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  searchQuery?: string;
}

const ContactsList: React.FC<ContactsListProps> = ({
  contacts,
  selectedContact,
  onSelectContact,
  searchQuery = ''
}) => {
  // Filter contacts based on search query
  const filteredContacts = React.useMemo(() => {
    if (!searchQuery) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(query) ||
      contact.phone.includes(query) ||
      (contact.lastMessage && contact.lastMessage.toLowerCase().includes(query))
    );
  }, [contacts, searchQuery]);

  // Empty state when no contacts
  if (contacts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            Nenhuma conversa ainda
          </p>
          <p className="text-xs text-gray-400">
            Suas conversas aparecerão aqui
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredContacts.map((contact) => (
          <ContactItem
            key={contact.id}
            contact={contact}
            isSelected={selectedContact?.id === contact.id}
            onClick={() => onSelectContact(contact)}
          />
        ))}

        {/* Empty search results */}
        {filteredContacts.length === 0 && searchQuery && (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                Nenhum resultado para "{searchQuery}"
              </p>
              <p className="text-xs text-gray-400">
                Tente buscar por nome, telefone ou mensagem
              </p>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default ContactsList;
