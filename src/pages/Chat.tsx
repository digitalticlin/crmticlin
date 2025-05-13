
import { cn } from "@/lib/utils";
import Sidebar from "@/components/layout/Sidebar";
import { ContactsList } from "@/components/chat/ContactsList";
import { ChatArea } from "@/components/chat/ChatArea";
import { EmptyState } from "@/components/chat/EmptyState";
import { ContactDetails } from "@/components/chat/ContactDetails";
import { useChat } from "@/hooks/useChat";
import { LoadingSpinner } from "@/components/ui/spinner";

export default function Chat() {
  // Use our custom hook to manage chat state
  const {
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    contactDetailsOpen,
    setContactDetailsOpen,
    contactNotes,
    setContactNotes,
    updateContactNotes,
    sendMessage,
    isLoadingContacts,
    isLoadingMessages
  } = useChat();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex h-full overflow-hidden">
        {/* Left: Contacts List */}
        <div className={cn(
          "h-full w-full max-w-sm border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white/10 dark:bg-black/10 backdrop-blur-lg relative",
          selectedContact ? "hidden md:flex" : "flex"
        )}>
          {isLoadingContacts && contacts.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
              <LoadingSpinner size="lg" />
            </div>
          )}
          <ContactsList 
            contacts={contacts} 
            selectedContact={selectedContact} 
            onSelectContact={setSelectedContact} 
          />
        </div>
        
        {/* Right: Chat Area */}
        <div className={cn(
          "h-full flex-1 flex flex-col bg-white/5 dark:bg-black/5 backdrop-blur-lg relative",
          !selectedContact && "hidden md:flex"
        )}>
          {isLoadingMessages && messages.length === 0 && selectedContact && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
              <LoadingSpinner size="lg" />
            </div>
          )}
          
          {selectedContact ? (
            <ChatArea 
              selectedContact={selectedContact}
              messages={messages}
              onOpenContactDetails={() => setContactDetailsOpen(true)}
              onBack={() => setSelectedContact(null)}
              onSendMessage={sendMessage}
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
            onUpdateNotes={updateContactNotes}
          />
        )}
      </main>
    </div>
  );
}
