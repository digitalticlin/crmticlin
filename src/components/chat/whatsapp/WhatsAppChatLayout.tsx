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

  const handleEditLead = () => {
    setIsDetailsSidebarOpen(true);
  };

  return (
    <div className="h-full flex overflow-hidden relative z-10">
      {/* Painel Esquerdo - Lista de Conversas com glassmorphism */}
      <div className={cn(
        "w-full max-w-[400px] flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg relative z-10",
        selectedContact ? "hidden lg:flex" : "flex"
      )}>
        <WhatsAppContactsList
          contacts={updatedContacts}
          selectedContact={selectedContact}
          onSelectContact={onSelectContact}
          isLoading={isLoadingContacts}
        />
      </div>

      {/* Painel Central - Área de Chat com glassmorphism */}
      <div className={cn(
        "flex-1 flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg overflow-hidden relative z-10 ml-1",
        !selectedContact && "hidden lg:flex",
        isDetailsSidebarOpen && "lg:mr-96"
      )}>
        {selectedContact ? (
          <WhatsAppChatArea
            selectedContact={selectedContact}
            messages={messages}
            onSendMessage={onSendMessage}
            onBack={() => onSelectContact(null)}
            isLoadingMessages={isLoadingMessages}
            isSending={isSending}
            onEditLead={handleEditLead}
          />
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
