import { cn } from "@/lib/utils";
import ResponsiveSidebar from "@/components/layout/ResponsiveSidebar";
import { ContactsList } from "@/components/chat/ContactsList";
import { ChatArea } from "@/components/chat/ChatArea";
import { EmptyState } from "@/components/chat/EmptyState";
import { ContactDetails } from "@/components/chat/ContactDetails";
import { useChat } from "@/hooks/useChat";
import { LoadingSpinner } from "@/components/ui/spinner";
import { RefreshCw } from "lucide-react";

export default function Chat() {
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
    isLoadingMessages,
    handleManualRefresh
  } = useChat();

  // Empty state: no contacts and not loading
  const showEmptyState = contacts.length === 0 && !isLoadingContacts;

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <ResponsiveSidebar />

      <main className="flex-1 flex h-full overflow-hidden">
        {/* Left: Contacts List */}
        <div className={cn(
          "h-full w-full max-w-sm border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white/10 dark:bg-black/10 backdrop-blur-lg relative",
          selectedContact ? "hidden md:flex" : "flex"
        )}>
          {/* Manual refresh button */}
          <div className="p-2 flex items-center justify-end border-b border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-black/40 backdrop-blur z-10">
            <button
              className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-primary/10 text-primary outline-none border-none focus:ring-2 focus:ring-primary"
              onClick={handleManualRefresh}
              disabled={isLoadingContacts}
              aria-label="Atualizar chats"
              type="button"
              style={{ minHeight: 28, minWidth: 28 }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingContacts ? "animate-spin" : ""}`} />
            </button>
          </div>
          {isLoadingContacts && contacts.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm z-20">
              <LoadingSpinner size="lg" />
              <span className="ml-2 text-muted-foreground text-base animate-pulse">
                Carregando chats...
              </span>
            </div>
          )}
          {showEmptyState ? (
            <div className="flex flex-1 items-center justify-center px-4 text-center">
              <div className="space-y-3 w-full">
                <h2 className="text-2xl font-semibold">Seus chats ficarão aqui</h2>
                <p className="text-muted-foreground">
                  Conecte o WhatsApp e comece a usar.
                </p>
              </div>
            </div>
          ) : (
            <ContactsList
              contacts={contacts}
              selectedContact={selectedContact}
              onSelectContact={setSelectedContact}
            />
          )}
        </div>

        {/* Right: Chat Area */}
        <div className={cn(
          "h-full flex-1 flex flex-col bg-white/5 dark:bg-black/5 backdrop-blur-lg relative",
          !selectedContact && "hidden md:flex"
        )}>
          {isLoadingMessages && messages.length === 0 && selectedContact && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm z-10">
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
