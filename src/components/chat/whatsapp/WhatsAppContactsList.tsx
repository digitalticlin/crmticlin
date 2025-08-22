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
  onRefreshContacts?: () => void;
  totalContactsAvailable?: number;
  onEditLead?: () => void;
  onSearch?: (query: string) => Promise<void>;
}

export const WhatsAppContactsList = React.memo(({
  contacts,
  selectedContact,
  onSelectContact,
  isLoading,
  isLoadingMore = false,
  hasMoreContacts = false,
  onLoadMoreContacts,
  onRefreshContacts,
  totalContactsAvailable = 0,
  onEditLead,
  onSearch
}: WhatsAppContactsListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // 🚀 CORREÇÃO: Não filtrar localmente - dados já vêm filtrados do servidor
  const filteredContacts = useMemo(() => {
    // Se há busca ativa, os contatos já vêm filtrados do servidor via onSearch
    // Se não há busca, mostra todos os contatos carregados
    console.log('[WhatsAppContactsList] 📊 Contatos recebidos:', {
      total: contacts.length,
      hasSearch: !!searchQuery.trim(),
      searchQuery
    });
    return contacts;
  }, [contacts, searchQuery]);

  // Filtrar por tipo
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
      {/* Header fixo sem scroll */}
      <div className="flex-shrink-0 p-4 border-b border-white/20 backdrop-blur-sm bg-gradient-to-r from-white/10 to-white/5">
        <div className="space-y-3">
          {/* Título */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 drop-shadow-sm">
              Conversas ({finalContacts.length})
            </h2>
            
            {onRefreshContacts && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefreshContacts}
                disabled={isLoading}
                className="text-gray-600 hover:text-gray-800"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            )}
          </div>

          {/* Barra de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => {
                const q = e.target.value;
                setSearchQuery(q);
                if (onSearch) {
                  onSearch(q);
                }
              }}
              className="pl-10 pr-10 bg-white/20 border-white/30 text-gray-800 placeholder:text-gray-600 h-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-gray-600 hover:text-gray-800"
              >
                ×
              </Button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex space-x-2">
            {[
              { key: "all", label: "Todas", count: totalContactsAvailable || contacts.length },
              { key: "unread", label: "Não lidas", count: contacts.filter(c => c.unreadCount && c.unreadCount > 0).length },
              { key: "recent", label: "Recentes", count: contacts.filter(c => c.lastMessageTime).length }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                  activeFilter === filter.key
                    ? "bg-white/30 text-gray-800 border border-white/40 shadow-sm"
                    : "bg-white/10 text-gray-700 hover:bg-white/20 hover:text-gray-800 border border-transparent"
                )}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Container da lista com scroll interno - ALTURA FIXA E SCROLL FORÇADO */}
      <div 
        className="flex-1 min-h-0 glass-scrollbar"
        style={{ 
          overflowY: 'auto'
        }}
      >
        <ContactsList
          contacts={finalContacts}
          selectedContact={selectedContact}
          onSelectContact={onSelectContact}
          searchQuery={searchQuery}
          activeFilter={activeFilter}
          isLoadingMore={isLoadingMore}
          hasMoreContacts={hasMoreContacts}
          onLoadMoreContacts={onLoadMoreContacts}
          onRefreshContacts={onRefreshContacts}
          totalContactsAvailable={totalContactsAvailable}
          onEditLead={onEditLead}
        />
      </div>

      {/* Loading indicator fixo */}
      {isLoading && contacts.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-gray-800">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Carregando conversas...</span>
          </div>
        </div>
      )}
    </div>
  );
});

WhatsAppContactsList.displayName = 'WhatsAppContactsList';
