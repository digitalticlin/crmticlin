
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
    <div className="h-full flex bg-[#111b21] text-white overflow-hidden">
      {/* Painel Esquerdo - Lista de Conversas */}
      <div className={cn(
        "w-full max-w-[400px] border-r border-[#313d45] flex flex-col bg-[#0b141a]",
        selectedContact ? "hidden lg:flex" : "flex"
      )}>
        <WhatsAppContactsList
          contacts={updatedContacts}
          selectedContact={selectedContact}
          onSelectContact={onSelectContact}
          isLoading={isLoadingContacts}
        />
      </div>

      {/* Painel Central - Área de Chat */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#0b141a]",
        !selectedContact && "hidden lg:flex",
        isDetailsSidebarOpen && "lg:pr-96"
      )}>
        {selectedContact ? (
          <>
            {/* Chat Header with Details Button */}
            <div className="bg-[#202c33] border-b border-[#313d45] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSelectContact(null)}
                  className="lg:hidden text-[#8696a0] hover:text-[#e9edef]"
                >
                  ←
                </Button>
                <div>
                  <h2 className="text-[#e9edef] font-medium">{selectedContact.name}</h2>
                  <p className="text-[#8696a0] text-sm">
                    {selectedContact.isOnline ? 'online' : `+${selectedContact.phone}`}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDetailsSidebarOpen(!isDetailsSidebarOpen)}
                className={cn(
                  "text-[#8696a0] hover:text-[#e9edef]",
                  isDetailsSidebarOpen && "bg-[#2a3942] text-[#00a884]"
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
