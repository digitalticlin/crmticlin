
import { Contact } from "@/types/chat";
import { ContactsList } from "./ContactsList";
import { LoadingSpinner } from "@/components/ui/spinner";

interface ChatSidebarProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  isLoading: boolean;
}

export const ChatSidebar = ({
  contacts,
  selectedContact,
  onSelectContact,
  isLoading
}: ChatSidebarProps) => {
  if (isLoading) {
    return (
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-80">
      <ContactsList
        contacts={contacts}
        selectedContact={selectedContact}
        onSelectContact={onSelectContact}
      />
    </div>
  );
};
