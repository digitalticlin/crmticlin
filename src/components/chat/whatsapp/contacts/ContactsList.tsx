
import { Contact } from "@/types/chat";
import { SubtleScrollArea } from "@/components/ui/subtle-scroll-area";
import { ContactItem } from "./ContactItem";
import { EmptyContactsState } from "./EmptyContactsState";

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
  activeFilter
}: ContactsListProps) => {
  return (
    <SubtleScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {contacts.map((contact) => (
          <ContactItem
            key={contact.id}
            contact={contact}
            isSelected={selectedContact?.id === contact.id}
            onSelect={onSelectContact}
          />
        ))}
        
        {contacts.length === 0 && (
          <EmptyContactsState 
            searchQuery={searchQuery}
            activeFilter={activeFilter}
          />
        )}
      </div>
    </SubtleScrollArea>
  );
};
