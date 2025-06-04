
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContactItem } from "./ContactItem";
import { Contact } from "@/types/chat";

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
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {contacts.map((contact) => (
          <ContactItem
            key={contact.id}
            contact={contact}
            isSelected={selectedContact?.id === contact.id}
            onSelect={onSelectContact}
          />
        ))}
        
        {contacts.length === 0 && (
          <div className="flex items-center justify-center h-32 text-center">
            <p className="text-gray-600 text-sm">
              {searchQuery 
                ? "Nenhum contato encontrado" 
                : "Nenhuma conversa ainda"
              }
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
