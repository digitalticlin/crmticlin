
import { useState } from "react";
import React from "react";
import { cn } from "@/lib/utils";
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
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
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
  onRefreshContacts?: () => void;
  totalContactsAvailable?: number;
}

export const WhatsAppChatLayout = ({
  contacts,
  selectedContact,
  onSelectContact,
  isLoadingContacts,
  isLoadingMoreContacts,
  hasMoreContacts,
  onLoadMoreContacts,
  onRefreshContacts,
  totalContactsAvailable = 0
}: WhatsAppChatLayoutProps) => {
  const [isDetailsSidebarOpen, setIsDetailsSidebarOpen] = useState(false);

  const handleUpdateContact = (updatedContact: Contact) => {
    console.log('[WhatsAppChatLayout] 🔄 Atualizando contato selecionado:', {
      contactId: updatedContact.id,
      changes: {
        name: updatedContact.name,
        email: updatedContact.email,
        company: updatedContact.company,
        purchaseValue: updatedContact.purchaseValue,
        assignedUser: updatedContact.assignedUser
      }
    });

    onSelectContact(updatedContact);

    if (updatedContact.leadId || updatedContact.id) {
      window.dispatchEvent(new CustomEvent('leadUpdated', {
        detail: {
          leadId: updatedContact.leadId || updatedContact.id,
          updatedContact
        }
      }));
      
      console.log('[WhatsAppChatLayout] 📡 Evento de atualização de lead disparado');
    }
  };

  return (
    <div className="h-full flex overflow-hidden relative z-10">
      {/* Mobile layout */}
      <div className="lg:hidden w-full">
        {!selectedContact ? (
          <div className="w-full flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg relative z-10">
            <WhatsAppContactsList
              contacts={contacts}
              selectedContact={selectedContact}
              onSelectContact={onSelectContact}
              isLoading={isLoadingContacts}
              isLoadingMore={isLoadingMoreContacts}
              hasMoreContacts={hasMoreContacts}
              onLoadMoreContacts={onLoadMoreContacts}
              onRefreshContacts={onRefreshContacts}
              totalContactsAvailable={totalContactsAvailable}
            />
          </div>
        ) : (
          <div className="w-full flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg overflow-hidden relative z-10">
            <WhatsAppChatArea />
          </div>
        )}
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex w-full relative">
        <ResizablePanelGroup 
          direction="horizontal" 
          className="w-full"
        >
          <ResizablePanel 
            defaultSize={30} 
            minSize={20} 
            maxSize={50}
            className="relative"
          >
            <div className="h-full flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg relative z-10">
              <WhatsAppContactsList
                contacts={contacts}
                selectedContact={selectedContact}
                onSelectContact={onSelectContact}
                isLoading={isLoadingContacts}
                isLoadingMore={isLoadingMoreContacts}
                hasMoreContacts={hasMoreContacts}
                onLoadMoreContacts={onLoadMoreContacts}
                onRefreshContacts={onRefreshContacts}
                totalContactsAvailable={totalContactsAvailable}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle 
            withHandle={false}
            className="w-1 bg-transparent hover:bg-white/10 transition-colors duration-200 rounded-full border-0 relative group"
          />

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
                <WhatsAppChatArea />
              ) : (
                <WhatsAppEmptyState />
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <LeadDetailsSidebar
        selectedContact={selectedContact}
        isOpen={isDetailsSidebarOpen}
        onClose={() => setIsDetailsSidebarOpen(false)}
        onUpdateContact={handleUpdateContact}
      />
    </div>
  );
};
