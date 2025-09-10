
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContactSelectionItem } from './ContactSelectionItem';
import { Contact } from '@/types/chat';

interface ContactSelectionListProps {
  contacts: Contact[];
  selectedContactIds: Set<string>;
  searchQuery: string;
  onToggleContact: (contactId: string) => void;
  onSearchChange: (query: string) => void;
  disabled?: boolean;
}

export const ContactSelectionList: React.FC<ContactSelectionListProps> = ({
  contacts,
  selectedContactIds,
  searchQuery,
  onToggleContact,
  onSearchChange,
  disabled = false
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar contatos por nome ou telefone..."
            disabled={disabled}
            className="pl-10"
          />
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum contato encontrado</p>
              {searchQuery && (
                <p className="text-sm mt-1">
                  Tente ajustar sua busca
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {contacts.map((contact) => (
                <ContactSelectionItem
                  key={contact.id}
                  contact={contact}
                  isSelected={selectedContactIds.has(contact.id)}
                  onToggle={() => onToggleContact(contact.id)}
                  disabled={disabled}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
