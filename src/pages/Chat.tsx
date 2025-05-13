
import { cn } from "@/lib/utils";
import Sidebar from "@/components/layout/Sidebar";
import { ContactsList } from "@/components/chat/ContactsList";
import { ChatArea } from "@/components/chat/ChatArea";
import { EmptyState } from "@/components/chat/EmptyState";
import { ContactDetails } from "@/components/chat/ContactDetails";
import { useChat } from "@/hooks/useChat";
import { selectContact, sendMessage, updateContactNotes } from "@/utils/chatUtils";
import { Contact } from "@/types/chat";

export default function Chat() {
  // Use our custom hook to manage chat state
  const {
    contacts,
    setContacts,
    selectedContact,
    setSelectedContact,
    messages,
    setMessages,
    contactDetailsOpen,
    setContactDetailsOpen,
    contactNotes,
    setContactNotes
  } = useChat();

  // Handler functions that utilize our utility functions
  const handleSelectContact = (contact: Contact) => {
    selectContact(
      contact,
      setSelectedContact,
      setContactNotes,
      setMessages,
      setContacts,
      contacts
    );
  };

  const handleSendMessage = (newMessageText: string) => {
    sendMessage(
      newMessageText,
      selectedContact,
      messages,
      setMessages,
      setContacts,
      contacts
    );
  };

  const handleUpdateContactNotes = () => {
    updateContactNotes(
      selectedContact,
      contactNotes,
      setContacts,
      contacts,
      setSelectedContact
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex h-full overflow-hidden">
        {/* Left: Contacts List */}
        <div className={cn(
          "h-full w-full max-w-sm border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white/10 dark:bg-black/10 backdrop-blur-lg",
          selectedContact ? "hidden md:flex" : "flex"
        )}>
          <ContactsList 
            contacts={contacts} 
            selectedContact={selectedContact} 
            onSelectContact={handleSelectContact} 
          />
        </div>
        
        {/* Right: Chat Area */}
        <div className={cn(
          "h-full flex-1 flex flex-col bg-white/5 dark:bg-black/5 backdrop-blur-lg",
          !selectedContact && "hidden md:flex"
        )}>
          {selectedContact ? (
            <ChatArea 
              selectedContact={selectedContact}
              messages={messages}
              onOpenContactDetails={() => setContactDetailsOpen(true)}
              onBack={() => setSelectedContact(null)}
              onSendMessage={handleSendMessage}
            />
          ) : (
            <EmptyState />
          )}
        </div>
        
        {/* Contact Details Drawer */}
        {selectedContact && (
          <ContactDetails
            contact={selectedContact}
            isOpen={contactDetailsOpen}
            onOpenChange={setContactDetailsOpen}
            notes={contactNotes}
            onNotesChange={setContactNotes}
            onUpdateNotes={handleUpdateContactNotes}
          />
        )}
      </main>
    </div>
  );
}
