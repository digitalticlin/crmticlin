
import { useState } from "react";
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { WhatsAppContactsList } from "./WhatsAppContactsList";
import { WhatsAppChatArea } from "./WhatsAppChatArea";
import { WhatsAppEmptyState } from "./WhatsAppEmptyState";
import { LeadDetailsSidebar } from "./LeadDetailsSidebar";
import { Contact, Message } from "@/types/chat";

interface WhatsAppChatLayoutProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoadingContacts: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
}

export const WhatsAppChatLayout = ({
  contacts,
  selectedContact,
  onSelectContact,
  messages,
  onSendMessage,
  isLoadingContacts,
  isLoadingMessages,
  isSending
}: WhatsAppChatLayoutProps) => {
  const [isDetailsSidebarOpen, setIsDetailsSidebarOpen] = useState(false);
  const [updatedContacts, setUpdatedContacts] = useState<Contact[]>(contacts);

  // Update contacts when props change
  React.useEffect(() => {
    setUpdatedContacts(contacts);
  }, [contacts]);

  const handleUpdateContact = (updates: Partial<Contact>) => {
    if (!selectedContact) return;

    // Update the selected contact
    const updatedSelected = { ...selectedContact, ...updates };
    onSelectContact(updatedSelected);

    // Update the contacts list
    const newContacts = updatedContacts.map(contact => 
      contact.id === selectedContact.id 
        ? { ...contact, ...updates }
        : contact
    );
    setUpdatedContacts(newContacts);
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Painel Esquerdo - Lista de Conversas com card transparente */}
      <div className={cn(
        "w-full max-w-[400px] flex flex-col bg-white/10 backdrop-blur-md border-r border-white/20",
        selectedContact ? "hidden lg:flex" : "flex"
      )}>
        <WhatsAppContactsList
          contacts={updatedContacts}
          selectedContact={selectedContact}
          onSelectContact={onSelectContact}
          isLoading={isLoadingContacts}
        />
      </div>

      {/* Painel Central - Área de Chat com card transparente */}
      <div className={cn(
        "flex-1 flex flex-col bg-white/10 backdrop-blur-md",
        !selectedContact && "hidden lg:flex",
        isDetailsSidebarOpen && "lg:pr-96"
      )}>
        {selectedContact ? (
          <>
            {/* Chat Header with Details Button */}
            <div className="bg-white/20 backdrop-blur-sm border-b border-white/30 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSelectContact(null)}
                  className="lg:hidden text-gray-700 hover:text-gray-900 hover:bg-white/20"
                >
                  ←
                </Button>
                <div>
                  <h2 className="text-gray-900 font-medium">{selectedContact.name}</h2>
                  <p className="text-gray-600 text-sm">
                    {selectedContact.isOnline ? 'online' : `+${selectedContact.phone}`}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDetailsSidebarOpen(!isDetailsSidebarOpen)}
                className={cn(
                  "text-gray-700 hover:text-gray-900 hover:bg-white/20",
                  isDetailsSidebarOpen && "bg-white/30 text-gray-900"
                )}
              >
                <Info className="h-5 w-5" />
              </Button>
            </div>

            <WhatsAppChatArea
              selectedContact={selectedContact}
              messages={messages}
              onSendMessage={onSendMessage}
              onBack={() => onSelectContact(null)}
              isLoadingMessages={isLoadingMessages}
              isSending={isSending}
            />
          </>
        ) : (
          <WhatsAppEmptyState />
        )}
      </div>

      {/* Sidebar de Detalhes do Lead */}
      <LeadDetailsSidebar
        selectedContact={selectedContact}
        isOpen={isDetailsSidebarOpen}
        onClose={() => setIsDetailsSidebarOpen(false)}
        onUpdateContact={handleUpdateContact}
      />
    </div>
  );
};
