
import React from 'react';
import { useWhatsAppChatContext } from '../WhatsAppChatProvider';
import { ContactsList } from './ContactsList';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState } from 'react';

export const WhatsAppContactsList = () => {
  const { 
    contacts, 
    isLoadingContacts, 
    selectedContact, 
    setSelectedContact,
    loadMoreContacts,
    hasMoreContacts,
    isLoadingMoreContacts
  } = useWhatsAppChatContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white border-r">
      {/* Search Header */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar contatos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        <ContactsList
          contacts={filteredContacts}
          selectedContact={selectedContact}
          onContactSelect={setSelectedContact}
          searchQuery={searchQuery}
          isLoading={isLoadingContacts}
        />
        
        {/* Load More Button */}
        {hasMoreContacts && (
          <div className="p-4 border-t">
            <button
              onClick={loadMoreContacts}
              disabled={isLoadingMoreContacts}
              className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {isLoadingMoreContacts ? 'Carregando...' : 'Carregar mais contatos'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
