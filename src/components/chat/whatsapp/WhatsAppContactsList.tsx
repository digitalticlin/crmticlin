import React, { useState, useMemo } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ContactsList from "./contacts/ContactsList";
import { Contact } from "@/types/chat";
import { cn } from "@/lib/utils";

interface WhatsAppContactsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasMoreContacts?: boolean;
  onLoadMoreContacts?: () => Promise<void>;
}

export const WhatsAppContactsList = React.memo(({
  contacts,
  selectedContact,
  onSelectContact,
  isLoading,
  isLoadingMore = false,
  hasMoreContacts = false,
  onLoadMoreContacts
}: WhatsAppContactsListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Filtrar contatos baseado na busca
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(query) ||
      contact.phone.includes(query) ||
      (contact.lastMessage && contact.lastMessage.toLowerCase().includes(query))
    );
  }, [contacts, searchQuery]);

  // Filtrar por tipo (all, unread, etc.)
  const finalContacts = useMemo(() => {
    switch (activeFilter) {
      case "unread":
        return filteredContacts.filter(contact => contact.unreadCount && contact.unreadCount > 0);
      case "recent":
        return filteredContacts.filter(contact => contact.lastMessageTime);
      default:
        return filteredContacts;
    }
  }, [filteredContacts, activeFilter]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="h-full flex flex-col relative z-10">
      {/* Header com busca */}
      <div className="p-4 border-b border-white/20 backdrop-blur-sm bg-gradient-to-r from-white/10 to-white/5">
        <div className="space-y-3">
          {/* Título */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Conversas ({finalContacts.length})
            </h2>
          </div>

          {/* Barra de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300 h-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-gray-400 hover:text-white"
              >
                ×
              </Button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex space-x-2">
            {[
              { key: "all", label: "Todas", count: contacts.length },
              { key: "unread", label: "Não lidas", count: contacts.filter(c => c.unreadCount && c.unreadCount > 0).length },
              { key: "recent", label: "Recentes", count: contacts.filter(c => c.lastMessageTime).length }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                  activeFilter === filter.key
                    ? "bg-white/20 text-white border border-white/30"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-transparent"
                )}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de contatos com paginação */}
      <ContactsList
        contacts={finalContacts}
        selectedContact={selectedContact}
        onSelectContact={onSelectContact}
        searchQuery={searchQuery}
        activeFilter={activeFilter}
        isLoadingMore={isLoadingMore}
        hasMoreContacts={hasMoreContacts}
        onLoadMoreContacts={onLoadMoreContacts}
      />

      {/* Loading indicator */}
      {isLoading && contacts.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-white">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Carregando conversas...</span>
          </div>
        </div>
      )}
    </div>
  );
});
