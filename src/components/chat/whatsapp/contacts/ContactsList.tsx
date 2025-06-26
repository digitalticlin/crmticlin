
import { Contact } from "@/types/chat";
import { ContactItem } from "./ContactItem";
import { EmptyContactsState } from "./EmptyContactsState";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ContactsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  searchQuery: string;
  activeFilter: string;
}

export const ContactsList = ({
  contacts,
  selectedContact,
  onSelectContact,
  searchQuery,
  activeFilter,
}: ContactsListProps) => {
  return (
    <div className="h-full flex flex-col bg-white/5 backdrop-blur-lg border-r border-white/20">
      {/* Lista de contatos com scroll customizado */}
      <ScrollArea className="flex-1 contacts-scrollbar">
        <div className="px-2 py-1 space-y-1">
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <ContactItem
                key={contact.id}
                contact={contact}
                isSelected={selectedContact?.id === contact.id}
                onSelect={onSelectContact}
              />
            ))
          ) : (
            <div className="p-8">
              <EmptyContactsState 
                searchQuery={searchQuery}
                activeFilter={activeFilter}
              />
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Contador de contatos */}
      {contacts.length > 0 && (
        <div className="p-3 border-t border-white/10 text-center">
          <span className="text-xs text-gray-500">
            {contacts.length} contato{contacts.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};
