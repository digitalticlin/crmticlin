import { useState } from "react";
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
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
  isLoadingMoreContacts: boolean;
  hasMoreContacts: boolean;
  onLoadMoreContacts: () => Promise<void>;
  isLoadingMessages: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  onLoadMoreMessages: () => Promise<void>;
  isSending: boolean;
  onRefreshMessages?: () => void;
}

export const WhatsAppChatLayout = ({
  contacts,
  selectedContact,
  onSelectContact,
  messages,
  onSendMessage,
  isLoadingContacts,
  isLoadingMoreContacts,
  hasMoreContacts,
  onLoadMoreContacts,
  isLoadingMessages,
  isLoadingMore,
  hasMoreMessages,
  onLoadMoreMessages,
  isSending,
  onRefreshMessages
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
      {/* Mobile layout - comportamento atual */}
      <div className="lg:hidden w-full">
        {!selectedContact ? (
          <div className="w-full flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg relative z-10">
            <WhatsAppContactsList
              contacts={updatedContacts}
              selectedContact={selectedContact}
              onSelectContact={onSelectContact}
              isLoading={isLoadingContacts}
              isLoadingMore={isLoadingMoreContacts}
              hasMoreContacts={hasMoreContacts}
              onLoadMoreContacts={onLoadMoreContacts}
            />
          </div>
        ) : (
          <div className="w-full flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg overflow-hidden relative z-10">
            <WhatsAppChatArea
              selectedContact={selectedContact}
              messages={messages}
              onSendMessage={onSendMessage}
              onBack={() => onSelectContact(null)}
              isLoadingMessages={isLoadingMessages}
              isLoadingMore={isLoadingMore}
              hasMoreMessages={hasMoreMessages}
              onLoadMoreMessages={onLoadMoreMessages}
              isSending={isSending}
              onEditLead={handleEditLead}
              onRefreshMessages={onRefreshMessages}
            />
          </div>
        )}
      </div>

      {/* Desktop layout - com redimensionamento */}
      <div className="hidden lg:flex w-full relative">
        <ResizablePanelGroup 
          direction="horizontal" 
          className="w-full"
        >
          {/* Painel da Lista de Conversas */}
          <ResizablePanel 
            defaultSize={30} 
            minSize={20} 
            maxSize={50}
            className="relative"
          >
            <div className="h-full flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg relative z-10">
              <WhatsAppContactsList
                contacts={updatedContacts}
                selectedContact={selectedContact}
                onSelectContact={onSelectContact}
                isLoading={isLoadingContacts}
                isLoadingMore={isLoadingMoreContacts}
                hasMoreContacts={hasMoreContacts}
                onLoadMoreContacts={onLoadMoreContacts}
              />
            </div>
          </ResizablePanel>

          {/* Handle para redimensionar - SEM ícone */}
          <ResizableHandle 
            withHandle={false}
            className="w-1 bg-transparent hover:bg-white/10 transition-colors duration-200 rounded-full border-0 relative group"
          />

          {/* Painel da Área de Chat */}
          <ResizablePanel 
            defaultSize={70} 
            minSize={50}
            className={cn(
              "relative",
              isDetailsSidebarOpen && "mr-80"
            )}
          >
            <div className="h-full flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg overflow-hidden relative z-10">
              {selectedContact ? (
                <WhatsAppChatArea
                  selectedContact={selectedContact}
                  messages={messages}
                  onSendMessage={onSendMessage}
                  onBack={() => onSelectContact(null)}
                  isLoadingMessages={isLoadingMessages}
                  isLoadingMore={isLoadingMore}
                  hasMoreMessages={hasMoreMessages}
                  onLoadMoreMessages={onLoadMoreMessages}
                  isSending={isSending}
                  onEditLead={handleEditLead}
                  onRefreshMessages={onRefreshMessages}
                />
              ) : (
                <WhatsAppEmptyState />
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
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
