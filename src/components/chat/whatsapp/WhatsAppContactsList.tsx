
import { useState } from "react";
import { Contact } from "@/types/chat";
import { LoadingSpinner } from "@/components/ui/spinner";
import { WhatsAppChatFilters } from "./WhatsAppChatFilters";
import { ContactsList } from "./contacts/ContactsList";
import { useContactsFilters } from "./contacts/ContactsFilters";

interface WhatsAppContactsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  isLoading: boolean;
}

export const WhatsAppContactsList = ({
  contacts,
  selectedContact,
  onSelectContact,
  isLoading
}: WhatsAppContactsListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredContacts = useContactsFilters({
    contacts,
    searchQuery,
    activeFilter
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header com Filtros */}
      <div className="flex-shrink-0">
        <WhatsAppChatFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      {/* Lista de Contatos com Scroll Independente */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <ContactsList
            contacts={filteredContacts}
            selectedContact={selectedContact}
            onSelectContact={onSelectContact}
            searchQuery={searchQuery}
            activeFilter={activeFilter}
          />
        )}
      </div>
    </div>
  );
};
